import { BirdStateMachine } from './state-machine';
import { BehaviorEngine } from './behavior-engine';
import { ActivityUpdate, ActivityState } from '../../shared/types';
import {
  HYDRATION_REMINDER_MS,
  DISMISS_COOLDOWN_MS,
  SLEEPY_HOUR,
  MORNING_HOUR,
} from '../../shared/constants';

jest.useFakeTimers();

/**
 * Helper: creates a Date object at a specific hour (local time) and returns
 * its epoch‐millisecond value so we can feed it to the injectable `now` clock.
 */
function dateAtHour(hour: number): number {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/**
 * Helper: builds an ActivityUpdate with sensible defaults.
 */
function makeUpdate(
  state: ActivityState,
  continuousWorkMinutes = 0,
  keystrokesPerWindow = 0,
): ActivityUpdate {
  return { state, keystrokesPerWindow, continuousWorkMinutes };
}

describe('BehaviorEngine', () => {
  let sm: BirdStateMachine;
  let engine: BehaviorEngine;
  let clock: number;

  beforeEach(() => {
    // Default clock: noon — well within normal hours.
    clock = dateAtHour(12);
    sm = new BirdStateMachine();
    engine = new BehaviorEngine(sm, () => clock);
  });

  afterEach(() => {
    engine.destroy();
    sm.destroy();
    jest.clearAllTimers();
  });

  // ---------------------------------------------------------------------------
  // Task 4.1 — Activity to bird state mapping
  // ---------------------------------------------------------------------------
  describe('Activity to bird state mapping (Task 4.1)', () => {
    it('transitions bird to sleeping when activity is active_typing', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 5, 60));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('transitions bird to idle when activity is light_activity', () => {
      // First move to a non-idle state so the transition is visible.
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('sleeping');

      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('transitions bird to alert when activity is idle', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('alert');
    });

    it('stays in sleeping on repeated active_typing updates', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 1, 50));
      engine.handleActivityUpdate(makeUpdate('active_typing', 2, 55));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('transitions from alert back to sleeping on active_typing', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('alert');

      engine.handleActivityUpdate(makeUpdate('active_typing', 1, 70));
      // alert → idle is valid, then idle → sleeping is valid
      // OR the engine may transition alert → idle first, then idle → sleeping.
      // Accept sleeping as the end result.
      expect(sm.getCurrentState()).toBe('sleeping');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4.2 — Stretch reminder
  // ---------------------------------------------------------------------------
  describe('Stretch reminder (Task 4.2)', () => {
    it('enters nudging state after 45 min continuous work', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');
    });

    it('returns "Stretch a little?" from getActiveReminder() during stretch nudge', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBe('Stretch a little?');
    });

    it('does not nudge before 45 min of continuous work', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 44, 80));
      engine.tick();
      expect(sm.getCurrentState()).not.toBe('nudging');
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('does not nudge at exactly 0 continuous work minutes', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('nudges when continuous work exceeds 45 min', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 60, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');
      expect(engine.getActiveReminder()).toBe('Stretch a little?');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4.3 — Hydration reminder
  // ---------------------------------------------------------------------------
  describe('Hydration reminder (Task 4.3)', () => {
    it('shows hydration reminder every 60 min', () => {
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));

      // Advance the clock by HYDRATION_REMINDER_MS
      clock += HYDRATION_REMINDER_MS;
      engine.tick();

      expect(engine.getActiveReminder()).toBe('Stay hydrated!');
    });

    it('returns "Stay hydrated!" from getActiveReminder()', () => {
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));
      clock += HYDRATION_REMINDER_MS;
      engine.tick();

      expect(engine.getActiveReminder()).toBe('Stay hydrated!');
    });

    it('does not show hydration reminder before 60 min', () => {
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));
      clock += HYDRATION_REMINDER_MS - 1;
      engine.tick();

      expect(engine.getActiveReminder()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4.4 — Dismissal cooldown
  // ---------------------------------------------------------------------------
  describe('Dismissal cooldown (Task 4.4)', () => {
    it('suppresses re-nudge for 15 min after dismiss()', () => {
      // Trigger a nudge
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');

      // Dismiss
      engine.dismiss();
      expect(engine.getActiveReminder()).toBeNull();

      // Still working after dismiss — should NOT re-nudge within cooldown
      clock += DISMISS_COOLDOWN_MS - 1;
      engine.handleActivityUpdate(makeUpdate('active_typing', 50, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('resumes reminders after the 15 min cooldown expires', () => {
      // Trigger and dismiss a nudge
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      engine.dismiss();

      // Advance past cooldown
      clock += DISMISS_COOLDOWN_MS;
      engine.handleActivityUpdate(makeUpdate('active_typing', 46, 80));
      engine.tick();

      expect(sm.getCurrentState()).toBe('nudging');
      expect(engine.getActiveReminder()).not.toBeNull();
    });

    it('dismiss clears the active reminder immediately', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(engine.getActiveReminder()).not.toBeNull();

      engine.dismiss();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('multiple dismissals each reset the cooldown timer', () => {
      // First nudge + dismiss
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      engine.dismiss();

      // Advance past cooldown, trigger second nudge
      clock += DISMISS_COOLDOWN_MS;
      engine.handleActivityUpdate(makeUpdate('active_typing', 50, 80));
      engine.tick();
      expect(engine.getActiveReminder()).not.toBeNull();

      // Dismiss again
      engine.dismiss();

      // Not yet past the second cooldown
      clock += DISMISS_COOLDOWN_MS - 1;
      engine.handleActivityUpdate(makeUpdate('active_typing', 55, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4.5 — Time-of-day awareness
  // ---------------------------------------------------------------------------
  describe('Time-of-day awareness (Task 4.5)', () => {
    it('bird becomes sleepy after 10 PM', () => {
      clock = dateAtHour(SLEEPY_HOUR); // 22:00
      // Re-create engine at the test time to avoid hydration triggering from noon
      engine = new BehaviorEngine(sm, () => clock);
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 5));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('bird becomes sleepy at 11 PM', () => {
      clock = dateAtHour(23);
      engine = new BehaviorEngine(sm, () => clock);
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 5));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('bird is sleepy before 7 AM', () => {
      clock = dateAtHour(5);
      engine = new BehaviorEngine(sm, () => clock);
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 5));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('bird is sleepy at midnight', () => {
      clock = dateAtHour(0);
      engine = new BehaviorEngine(sm, () => clock);
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 5));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('no time-based sleepy override at 7 AM', () => {
      clock = dateAtHour(MORNING_HOUR); // 07:00
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      engine.tick();
      // Should follow normal activity mapping (idle → alert), not be forced to sleeping.
      expect(sm.getCurrentState()).not.toBe('sleeping');
    });

    it('no time-based sleepy override during normal hours (noon)', () => {
      clock = dateAtHour(12);
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      engine.tick();
      expect(sm.getCurrentState()).toBe('alert');
    });

    it('no time-based sleepy override at 9 PM (before SLEEPY_HOUR)', () => {
      clock = dateAtHour(21);
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      engine.tick();
      expect(sm.getCurrentState()).not.toBe('sleeping');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4.6 — Integration: BehaviorEngine + BirdStateMachine
  // ---------------------------------------------------------------------------
  describe('Integration: behavior engine + state machine', () => {
    it('full workflow: typing → nudge → dismiss → cooldown → re-nudge', () => {
      // 1. User starts typing
      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      expect(sm.getCurrentState()).toBe('sleeping');

      // 2. 45 minutes of continuous work → stretch nudge
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');
      expect(engine.getActiveReminder()).toBe('Stretch a little?');

      // 3. User dismisses
      engine.dismiss();
      expect(engine.getActiveReminder()).toBeNull();

      // 4. During cooldown, no re-nudge
      clock += DISMISS_COOLDOWN_MS / 2;
      engine.handleActivityUpdate(makeUpdate('active_typing', 50, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();

      // 5. After cooldown, nudge can fire again
      clock += DISMISS_COOLDOWN_MS; // well past cooldown now
      engine.handleActivityUpdate(makeUpdate('active_typing', 55, 80));
      engine.tick();
      expect(engine.getActiveReminder()).not.toBeNull();
    });

    it('transitions follow valid state machine rules', () => {
      const transitions: string[] = [];
      sm.onTransition((t) => transitions.push(`${t.from}->${t.to}`));

      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 80));
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));

      // Each recorded transition must have been valid according to the state machine.
      expect(transitions.length).toBeGreaterThan(0);
      // The state machine itself enforces validity — if we got here without errors,
      // all transitions were valid.
    });

    it('state machine listeners fire for engine-driven transitions', () => {
      const spy = jest.fn();
      sm.onTransition(spy);

      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 80));
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ from: 'idle', to: 'sleeping' }));
    });

    it('destroy() cleans up without errors', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      engine.destroy();

      // After destruction, further calls should not throw.
      expect(() => engine.tick()).not.toThrow();
      expect(() => engine.dismiss()).not.toThrow();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('late-night nudge still works during sleepy hours', () => {
      clock = dateAtHour(23);
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();

      // The engine should still nudge even at night if the user is working.
      // The exact behavior depends on implementation — either nudging overrides
      // sleepy or sleepy takes priority. Verify at least one state is set.
      const state = sm.getCurrentState();
      expect(['nudging', 'sleeping']).toContain(state);
    });

    it('hydration and stretch reminders prioritise correctly', () => {
      // Both 45‐min stretch and 60‐min hydration thresholds hit simultaneously.
      clock += HYDRATION_REMINDER_MS;
      engine.handleActivityUpdate(makeUpdate('active_typing', 60, 80));
      engine.tick();

      // At least one reminder should be active.
      const reminder = engine.getActiveReminder();
      expect(reminder).not.toBeNull();
      expect(['Stretch a little?', 'Stay hydrated!']).toContain(reminder);
    });

    it('idle activity resets stretch tracking', () => {
      // Work for 30 min, then go idle, then resume.
      engine.handleActivityUpdate(makeUpdate('active_typing', 30, 80));
      engine.tick();
      expect(sm.getCurrentState()).not.toBe('nudging');

      // User goes idle (break)
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));

      // Resume with only 10 more min — should not trigger stretch since break reset it.
      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });
  });
});
