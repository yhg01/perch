import {
  ACTIVE_TYPING_THRESHOLD,
  LIGHT_ACTIVITY_THRESHOLD,
  IDLE_DURATION_THRESHOLD,
  ACTIVITY_WINDOW_MS,
} from '../shared/constants';
import { ActivityState, ActivityUpdate } from '../shared/types';

/**
 * How often (ms) we emit state updates to subscribers.
 */
const STATE_POLL_INTERVAL_MS = 5_000;

/**
 * Duration of idle time (ms) that resets the continuous-work counter.
 * A gap of 5+ minutes of idle resets continuous work duration.
 */
const IDLE_RESET_THRESHOLD_MS = 5 * 60 * 1_000;

type StateUpdateCallback = (update: ActivityUpdate) => void;

/**
 * ActivityMonitor tracks AGGREGATE keystroke counts (never content!) and
 * classifies the user's work state into active_typing, light_activity, or idle.
 *
 * Design decisions:
 * - Keystroke timestamps are stored in a sliding window for the last 30 seconds.
 * - The time source is injectable (`now` parameter) so the class is fully testable
 *   without mocking Date.now().
 * - State updates are broadcast to subscribers every 5 seconds via callbacks.
 * - No actual key content is ever stored or logged — only aggregate counts.
 */
export class ActivityMonitor {
  /** Timestamps (ms) of recorded keystrokes within the sliding window. */
  private keystrokeTimestamps: number[] = [];

  /** Timestamp (ms) when the current continuous work session began. */
  private workSessionStartedAt: number | null = null;

  /** The last time we detected the user was NOT idle. -1 means no activity recorded yet. */
  private lastActiveAt: number = -1;

  /** The previous activity state, used to detect transitions. */
  private previousState: ActivityState = 'idle';

  /** Registered state-update callbacks. */
  private callbacks: StateUpdateCallback[] = [];

  /** Timer handle for the periodic state-update poll. */
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Injectable time source — defaults to Date.now. */
  private readonly now: () => number;

  constructor(now?: () => number) {
    this.now = now ?? Date.now;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Begin monitoring. Starts the periodic state-update poll.
   */
  start(): void {
    if (this.pollTimer !== null) {
      return; // already running
    }

    this.previousState = 'idle';

    this.pollTimer = setInterval(() => {
      this.tick();
    }, STATE_POLL_INTERVAL_MS);
  }

  /**
   * Stop monitoring. Cleans up all timers and resets internal state.
   */
  stop(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.keystrokeTimestamps = [];
    this.workSessionStartedAt = null;
    this.lastActiveAt = -1;
  }

  /**
   * Record a single keystroke event. Call this from whatever mechanism detects
   * global keyboard activity. ONLY the timestamp is stored — never the key value.
   */
  recordKeystroke(): void {
    const timestamp = this.now();

    // Check for idle gap reset: if the gap since last activity exceeds the
    // idle reset threshold, start a new work session.
    if (this.lastActiveAt >= 0 && timestamp - this.lastActiveAt >= IDLE_RESET_THRESHOLD_MS) {
      this.workSessionStartedAt = timestamp;
    }

    this.keystrokeTimestamps.push(timestamp);
    this.lastActiveAt = timestamp;

    // Start tracking work session on first keystroke if not already tracking.
    if (this.workSessionStartedAt === null) {
      this.workSessionStartedAt = timestamp;
    }

    // Lazily prune old entries to keep memory bounded.
    this.pruneWindow();
  }

  /**
   * Return the number of keystrokes recorded within the sliding window
   * (last ACTIVITY_WINDOW_MS milliseconds).
   */
  getKeystrokesInWindow(): number {
    this.pruneWindow();
    return this.keystrokeTimestamps.length;
  }

  /**
   * Classify the current activity state based on keystrokes in the sliding
   * window and how long the user has been idle.
   *
   * Rules:
   *   - "active_typing" : keystrokes in window > ACTIVE_TYPING_THRESHOLD
   *   - "light_activity": keystrokes in window >= LIGHT_ACTIVITY_THRESHOLD
   *   - "idle"          : keystrokes in window < LIGHT_ACTIVITY_THRESHOLD AND
   *                       the user has been below that threshold for at least
   *                       IDLE_DURATION_THRESHOLD ms.
   *
   * If the keystrokes are below LIGHT_ACTIVITY_THRESHOLD but the user has NOT
   * yet been quiet for IDLE_DURATION_THRESHOLD, we report "light_activity" as a
   * transitional state so the bird doesn't immediately jump to idle on every
   * short pause.
   */
  getActivityState(): ActivityState {
    const count = this.getKeystrokesInWindow();
    const currentTime = this.now();

    if (count > ACTIVE_TYPING_THRESHOLD) {
      return 'active_typing';
    }

    if (count >= LIGHT_ACTIVITY_THRESHOLD) {
      return 'light_activity';
    }

    // If no activity has ever been recorded, we're idle.
    if (this.lastActiveAt < 0) {
      return 'idle';
    }

    // Below light-activity threshold — check how long since last meaningful activity.
    const idleDuration = currentTime - this.lastActiveAt;
    if (idleDuration >= IDLE_DURATION_THRESHOLD) {
      return 'idle';
    }

    // Not idle long enough yet; still considered light activity.
    return 'light_activity';
  }

  /**
   * Return the number of whole minutes the user has been continuously working
   * (typing or light activity) without a 5+ minute idle gap.
   */
  getContinuousWorkMinutes(): number {
    if (this.workSessionStartedAt === null) {
      return 0;
    }

    const elapsed = this.now() - this.workSessionStartedAt;
    return Math.floor(elapsed / 60_000);
  }

  /**
   * Register a callback that will be invoked every STATE_POLL_INTERVAL_MS with
   * the latest ActivityUpdate.
   */
  onStateUpdate(callback: StateUpdateCallback): void {
    this.callbacks.push(callback);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Called on every poll tick. Prunes the window, computes state, manages the
   * continuous-work session, and broadcasts to subscribers.
   */
  private tick(): void {
    this.pruneWindow();

    const state = this.getActivityState();

    // If transitioning TO idle, check whether the idle gap is long enough to
    // reset the continuous work timer.
    if (state === 'idle') {
      const idleDuration = this.now() - this.lastActiveAt;
      if (idleDuration >= IDLE_RESET_THRESHOLD_MS) {
        // Long idle gap — reset continuous work tracking.
        this.workSessionStartedAt = null;
      }
    } else if (this.workSessionStartedAt === null) {
      // Resuming work after a long idle — start a new session.
      this.workSessionStartedAt = this.now();
    }

    this.previousState = state;

    const update: ActivityUpdate = {
      state,
      keystrokesPerWindow: this.getKeystrokesInWindow(),
      continuousWorkMinutes: this.getContinuousWorkMinutes(),
    };

    for (const cb of this.callbacks) {
      cb(update);
    }
  }

  /**
   * Remove keystroke timestamps that are older than the sliding window.
   */
  private pruneWindow(): void {
    const cutoff = this.now() - ACTIVITY_WINDOW_MS;

    // Timestamps are appended in chronological order, so we can binary-search
    // or simply shift from the front. A linear scan is fine for a 30-second
    // window at human typing speeds (unlikely to exceed a few hundred entries).
    while (this.keystrokeTimestamps.length > 0 && this.keystrokeTimestamps[0] < cutoff) {
      this.keystrokeTimestamps.shift();
    }
  }
}
