import { ActivityMonitor } from './activity-monitor';
import { ActivityUpdate } from '../shared/types';
import {
  ACTIVE_TYPING_THRESHOLD,
  LIGHT_ACTIVITY_THRESHOLD,
  ACTIVITY_WINDOW_MS,
  IDLE_DURATION_THRESHOLD,
} from '../shared/constants';

describe('ActivityMonitor', () => {
  let monitor: ActivityMonitor;
  let mockNow: number;
  const now = () => mockNow;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNow = 0;
    monitor = new ActivityMonitor(now);
  });

  afterEach(() => {
    monitor.stop();
    jest.useRealTimers();
  });

  // ─── 1. Initial state ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start with zero keystrokes in window', () => {
      expect(monitor.getKeystrokesInWindow()).toBe(0);
    });

    it('should start in idle state', () => {
      expect(monitor.getActivityState()).toBe('idle');
    });

    it('should start with zero continuous work minutes', () => {
      expect(monitor.getContinuousWorkMinutes()).toBe(0);
    });
  });

  // ─── 2. Keystroke recording ─────────────────────────────────────────────────

  describe('keystroke recording', () => {
    it('should increase keystroke count after recording a keystroke', () => {
      monitor.recordKeystroke();
      expect(monitor.getKeystrokesInWindow()).toBe(1);
    });

    it('should accumulate multiple keystrokes', () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getKeystrokesInWindow()).toBe(10);
    });

    it('should count keystrokes recorded at different times within the window', () => {
      monitor.recordKeystroke();
      mockNow = 5_000;
      monitor.recordKeystroke();
      mockNow = 15_000;
      monitor.recordKeystroke();
      expect(monitor.getKeystrokesInWindow()).toBe(3);
    });
  });

  // ─── 3. Sliding window ─────────────────────────────────────────────────────

  describe('sliding window', () => {
    it('should expire keystrokes older than 30s', () => {
      monitor.recordKeystroke();
      monitor.recordKeystroke();
      monitor.recordKeystroke();
      expect(monitor.getKeystrokesInWindow()).toBe(3);

      // Advance past the window
      mockNow = ACTIVITY_WINDOW_MS + 1;
      expect(monitor.getKeystrokesInWindow()).toBe(0);
    });

    it('should keep keystrokes within the 30s window', () => {
      monitor.recordKeystroke();
      mockNow = ACTIVITY_WINDOW_MS - 1;
      expect(monitor.getKeystrokesInWindow()).toBe(1);
    });

    it('should only expire old keystrokes while retaining recent ones', () => {
      // Record 3 keystrokes at t=0
      monitor.recordKeystroke();
      monitor.recordKeystroke();
      monitor.recordKeystroke();

      // Record 2 more at t=20s
      mockNow = 20_000;
      monitor.recordKeystroke();
      monitor.recordKeystroke();

      // At t=31s, the first 3 should have expired, but the 2 from t=20s remain
      mockNow = ACTIVITY_WINDOW_MS + 1;
      expect(monitor.getKeystrokesInWindow()).toBe(2);
    });

    it('should expire all keystrokes when time advances well beyond the window', () => {
      for (let i = 0; i < 50; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getKeystrokesInWindow()).toBe(50);

      mockNow = ACTIVITY_WINDOW_MS * 3;
      expect(monitor.getKeystrokesInWindow()).toBe(0);
    });
  });

  // ─── 4. Activity state classification ──────────────────────────────────────

  describe('activity state classification', () => {
    it('should return active_typing when keystrokes exceed ACTIVE_TYPING_THRESHOLD', () => {
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getActivityState()).toBe('active_typing');
    });

    it('should return active_typing at exactly ACTIVE_TYPING_THRESHOLD + 1 keystrokes', () => {
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getActivityState()).toBe('active_typing');
    });

    it('should return light_activity when keystrokes are between LIGHT_ACTIVITY_THRESHOLD and ACTIVE_TYPING_THRESHOLD', () => {
      for (let i = 0; i < LIGHT_ACTIVITY_THRESHOLD; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getActivityState()).toBe('light_activity');
    });

    it('should return light_activity at exactly ACTIVE_TYPING_THRESHOLD keystrokes', () => {
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getActivityState()).toBe('light_activity');
    });

    it('should return light_activity with few keystrokes before idle threshold elapses', () => {
      // Record a few keystrokes (below LIGHT_ACTIVITY_THRESHOLD) but not enough
      // time has passed for idle detection
      monitor.recordKeystroke();
      mockNow = 1_000;
      expect(monitor.getActivityState()).toBe('light_activity');
    });

    it('should return idle when below LIGHT_ACTIVITY_THRESHOLD and idle threshold has elapsed', () => {
      // Start with no activity and advance past IDLE_DURATION_THRESHOLD
      mockNow = IDLE_DURATION_THRESHOLD + 1;
      expect(monitor.getActivityState()).toBe('idle');
    });

    it('should return idle with zero keystrokes after idle duration has elapsed', () => {
      mockNow = IDLE_DURATION_THRESHOLD + 1;
      expect(monitor.getKeystrokesInWindow()).toBe(0);
      expect(monitor.getActivityState()).toBe('idle');
    });

    it('should transition from active_typing back to idle as keystrokes expire and idle threshold passes', () => {
      // Burst of typing
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 10; i++) {
        monitor.recordKeystroke();
      }
      expect(monitor.getActivityState()).toBe('active_typing');

      // Move past the window so keystrokes expire, then past the idle threshold
      mockNow = ACTIVITY_WINDOW_MS + IDLE_DURATION_THRESHOLD + 1;
      expect(monitor.getActivityState()).toBe('idle');
    });

    it('should return light_activity with few keystrokes when not yet past idle threshold', () => {
      // A few keystrokes (below light activity threshold)
      monitor.recordKeystroke();
      monitor.recordKeystroke();

      // Advance time but not past idle threshold
      mockNow = 10_000;
      expect(monitor.getActivityState()).toBe('light_activity');
    });

    describe('boundary values', () => {
      it('should classify exactly LIGHT_ACTIVITY_THRESHOLD keystrokes as light_activity', () => {
        for (let i = 0; i < LIGHT_ACTIVITY_THRESHOLD; i++) {
          monitor.recordKeystroke();
        }
        expect(monitor.getActivityState()).toBe('light_activity');
      });

      it('should classify LIGHT_ACTIVITY_THRESHOLD - 1 keystrokes as light_activity before idle threshold', () => {
        for (let i = 0; i < LIGHT_ACTIVITY_THRESHOLD - 1; i++) {
          monitor.recordKeystroke();
        }
        expect(monitor.getActivityState()).toBe('light_activity');
      });

      it('should classify LIGHT_ACTIVITY_THRESHOLD - 1 keystrokes as idle after idle threshold', () => {
        for (let i = 0; i < LIGHT_ACTIVITY_THRESHOLD - 1; i++) {
          monitor.recordKeystroke();
        }
        // Move past both the sliding window and the idle threshold
        mockNow = ACTIVITY_WINDOW_MS + IDLE_DURATION_THRESHOLD + 1;
        expect(monitor.getActivityState()).toBe('idle');
      });
    });
  });

  // ─── 5. Continuous work duration tracking ──────────────────────────────────

  describe('continuous work minutes', () => {
    it('should report zero minutes initially', () => {
      expect(monitor.getContinuousWorkMinutes()).toBe(0);
    });

    it('should track continuous work duration while typing', () => {
      // Start typing
      monitor.recordKeystroke();

      // Advance 10 minutes, keeping up activity
      for (let minute = 1; minute <= 10; minute++) {
        mockNow = minute * 60_000;
        // Record enough keystrokes to stay active
        for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
          monitor.recordKeystroke();
        }
      }

      expect(monitor.getContinuousWorkMinutes()).toBeGreaterThanOrEqual(10);
    });

    it('should reset continuous work minutes after an idle period', () => {
      // Type actively
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
        monitor.recordKeystroke();
      }

      // Advance past idle reset threshold (5 min) with no new keystrokes
      mockNow = 5 * 60 * 1_000 + 1;
      expect(monitor.getActivityState()).toBe('idle');

      // Start typing again
      monitor.recordKeystroke();
      mockNow += 1_000;

      // Continuous work should be near zero since we just came out of idle
      expect(monitor.getContinuousWorkMinutes()).toBeLessThan(1);
    });

    it('should accumulate minutes during sustained activity', () => {
      const startTime = 0;
      mockNow = startTime;

      // Simulate 30 minutes of sustained typing
      for (let second = 0; second < 30 * 60; second += 5) {
        mockNow = startTime + second * 1_000;
        monitor.recordKeystroke();
      }

      const workMinutes = monitor.getContinuousWorkMinutes();
      expect(workMinutes).toBeGreaterThanOrEqual(29);
      expect(workMinutes).toBeLessThanOrEqual(31);
    });
  });

  // ─── 6. State update callbacks ─────────────────────────────────────────────

  describe('state update callbacks', () => {
    it('should register and fire a callback', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      // Simulate some activity
      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
        monitor.recordKeystroke();
      }

      // Advance timers so the periodic check fires
      jest.advanceTimersByTime(5_000);

      expect(callback).toHaveBeenCalled();
    });

    it('should include correct state in the callback payload', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      for (let i = 0; i < ACTIVE_TYPING_THRESHOLD + 1; i++) {
        monitor.recordKeystroke();
      }

      jest.advanceTimersByTime(5_000);

      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      const update: ActivityUpdate = lastCall[0];
      expect(update.state).toBe('active_typing');
      expect(update.keystrokesPerWindow).toBeGreaterThan(ACTIVE_TYPING_THRESHOLD);
    });

    it('should include keystrokesPerWindow in the callback payload', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      for (let i = 0; i < 15; i++) {
        monitor.recordKeystroke();
      }

      jest.advanceTimersByTime(5_000);

      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall[0].keystrokesPerWindow).toBe(15);
    });

    it('should include continuousWorkMinutes in the callback payload', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      monitor.recordKeystroke();
      jest.advanceTimersByTime(5_000);

      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(typeof lastCall[0].continuousWorkMinutes).toBe('number');
    });

    it('should support multiple callbacks', () => {
      const callback1 = jest.fn<void, [ActivityUpdate]>();
      const callback2 = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback1);
      monitor.onStateUpdate(callback2);
      monitor.start();

      monitor.recordKeystroke();
      jest.advanceTimersByTime(5_000);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should stop firing callbacks after stop() is called', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      jest.advanceTimersByTime(5_000);
      const callCountAfterStart = callback.mock.calls.length;

      monitor.stop();
      jest.advanceTimersByTime(30_000);

      expect(callback.mock.calls.length).toBe(callCountAfterStart);
    });

    it('should fire callbacks periodically while running', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);
      monitor.start();

      jest.advanceTimersByTime(5_000);
      const firstCount = callback.mock.calls.length;

      jest.advanceTimersByTime(5_000);
      const secondCount = callback.mock.calls.length;

      expect(secondCount).toBeGreaterThan(firstCount);
    });
  });

  // ─── 7. Start / Stop lifecycle ─────────────────────────────────────────────

  describe('start and stop', () => {
    it('should not throw when start() is called', () => {
      expect(() => monitor.start()).not.toThrow();
    });

    it('should not throw when stop() is called without start()', () => {
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should not throw when stop() is called multiple times', () => {
      monitor.start();
      expect(() => {
        monitor.stop();
        monitor.stop();
      }).not.toThrow();
    });

    it('should allow restarting after stop', () => {
      const callback = jest.fn<void, [ActivityUpdate]>();
      monitor.onStateUpdate(callback);

      monitor.start();
      jest.advanceTimersByTime(5_000);
      monitor.stop();
      const countAfterStop = callback.mock.calls.length;

      monitor.start();
      jest.advanceTimersByTime(5_000);
      expect(callback.mock.calls.length).toBeGreaterThan(countAfterStop);
    });
  });
});
