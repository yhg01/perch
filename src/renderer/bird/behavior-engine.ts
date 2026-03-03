import { ActivityState, ActivityUpdate, BirdState } from '../../shared/types';
import {
  DISMISS_COOLDOWN_MS,
  HYDRATION_REMINDER_MS,
  IDLE_SLEEP_THRESHOLD_MS,
  STRETCH_REMINDER_MS,
} from '../../shared/constants';
import { BirdStateMachine } from './state-machine';

/**
 * Maps an ActivityState to the baseline BirdState the cat should adopt when no
 * reminder is active.
 *
 * - active_typing → happy  (cat is excited while you work)
 * - light_activity → idle  (cat relaxes)
 * - idle → nudging         (cat nudges you after 10s of inactivity)
 *
 * Idle escalation: after 300s of continuous idle, the cat falls asleep.
 */
const ACTIVITY_TO_BIRD_STATE: Record<ActivityState, BirdState> = {
  active_typing: 'happy',
  light_activity: 'idle',
  idle: 'nudging',
};

/** All reminder types the engine can produce. */
type ReminderKind = 'stretch' | 'hydration';

/** Message strings for each reminder kind. */
const REMINDER_MESSAGES: Record<ReminderKind, string> = {
  stretch: 'Stretch a little?',
  hydration: 'Stay hydrated!',
};

/** Convert STRETCH_REMINDER_MS to minutes for comparison with update data. */
const STRETCH_REMINDER_MINUTES = STRETCH_REMINDER_MS / 60_000;

export class BehaviorEngine {
  private stateMachine: BirdStateMachine;
  private now: () => number;

  /** Currently shown reminder kind, or null when no reminder is active. */
  private activeReminder: ReminderKind | null = null;

  /** Timestamp of the last hydration reminder (or engine creation). */
  private lastHydrationReminderAt: number;

  /** Whether a stretch reminder has already been shown for the current typing session. */
  private stretchReminderShownForSession: boolean = false;

  /** Timestamp when the user last dismissed a reminder (0 = never). */
  private lastDismissAt: number = 0;

  /** Most recently received activity state. */
  private lastActivityState: ActivityState = 'idle';

  /** Timestamp when the idle activity state began (0 = not idle). */
  private idleStartedAt: number = 0;

  constructor(stateMachine: BirdStateMachine, now?: () => number) {
    this.stateMachine = stateMachine;
    this.now = now ?? Date.now;
    this.lastHydrationReminderAt = this.now();
  }

  destroy(): void {
    this.activeReminder = null;
  }

  /**
   * Process an activity update from the activity monitor.
   */
  handleActivityUpdate(update: ActivityUpdate): void {
    const { state, continuousWorkMinutes } = update;
    const prevActivity = this.lastActivityState;
    this.lastActivityState = state;

    // Reset stretch tracking when user stops typing.
    if (state !== 'active_typing') {
      this.stretchReminderShownForSession = false;
    }

    // Track idle duration for sleep escalation.
    if (state === 'idle') {
      if (prevActivity !== 'idle' || this.idleStartedAt === 0) {
        this.idleStartedAt = this.now();
      }
    } else {
      this.idleStartedAt = 0;
    }

    // Check for stretch reminder using continuousWorkMinutes from the monitor.
    const reminder = this.evaluateReminders(state, continuousWorkMinutes);

    if (reminder !== null) {
      this.activateReminder(reminder);
    } else if (this.activeReminder === null) {
      // Check idle escalation: 300s of idle → sleeping
      if (state === 'idle' && this.idleStartedAt > 0) {
        const idleDuration = this.now() - this.idleStartedAt;
        if (idleDuration >= IDLE_SLEEP_THRESHOLD_MS) {
          this.transitionIfNeeded('sleeping', 'idle_sleep');
          return;
        }
      }

      const targetBirdState = ACTIVITY_TO_BIRD_STATE[state];
      this.transitionIfNeeded(targetBirdState, `activity:${state}`);
    }
  }

  /**
   * Dismiss the active reminder and start cooldown.
   */
  dismiss(): void {
    this.lastDismissAt = this.now();
    this.activeReminder = null;
    this.stretchReminderShownForSession = false;
    const baseline = ACTIVITY_TO_BIRD_STATE[this.lastActivityState];
    this.transitionIfNeeded(baseline, 'reminder_dismissed');
  }

  /**
   * Returns the message string for the currently active reminder, or null.
   */
  getActiveReminder(): string | null {
    if (this.activeReminder === null) {
      return null;
    }
    return REMINDER_MESSAGES[this.activeReminder];
  }

  /**
   * Periodic tick for time-based conditions (hydration, idle escalation).
   */
  tick(): void {
    if (this.isInCooldown()) {
      return;
    }

    // Hydration reminder: fires every HYDRATION_REMINDER_MS regardless of activity.
    if (this.activeReminder === null) {
      const elapsed = this.now() - this.lastHydrationReminderAt;
      if (elapsed >= HYDRATION_REMINDER_MS) {
        this.activateReminder('hydration');
        return;
      }
    }

    // Idle escalation: check on every tick if idle long enough to sleep.
    if (
      this.activeReminder === null &&
      this.lastActivityState === 'idle' &&
      this.idleStartedAt > 0
    ) {
      const idleDuration = this.now() - this.idleStartedAt;
      if (idleDuration >= IDLE_SLEEP_THRESHOLD_MS) {
        this.transitionIfNeeded('sleeping', 'idle_sleep');
      }
    }
  }

  private evaluateReminders(
    current: ActivityState,
    continuousWorkMinutes: number,
  ): ReminderKind | null {
    if (this.isInCooldown()) {
      return null;
    }

    // Stretch reminder: 45 min of continuous work during active typing.
    if (
      current === 'active_typing' &&
      continuousWorkMinutes >= STRETCH_REMINDER_MINUTES &&
      !this.stretchReminderShownForSession
    ) {
      this.stretchReminderShownForSession = true;
      return 'stretch';
    }

    return null;
  }

  private activateReminder(kind: ReminderKind): void {
    this.activeReminder = kind;

    if (kind === 'hydration') {
      this.lastHydrationReminderAt = this.now();
    }

    this.transitionIfNeeded('nudging', `reminder:${kind}`);
  }

  private isInCooldown(): boolean {
    if (this.lastDismissAt === 0) {
      return false;
    }
    return this.now() - this.lastDismissAt < DISMISS_COOLDOWN_MS;
  }

  private transitionIfNeeded(to: BirdState, trigger: string): void {
    if (this.stateMachine.getCurrentState() === to) {
      return;
    }
    this.stateMachine.transition(to, trigger);
  }
}
