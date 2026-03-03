import { BirdStateMachine } from './state-machine';
import { BehaviorEngine } from './behavior-engine';
import { ActivityUpdate, ActivityState } from '../../shared/types';
import {
  HYDRATION_REMINDER_MS,
  DISMISS_COOLDOWN_MS,
  IDLE_SLEEP_THRESHOLD_MS,
} from '../../shared/constants';

jest.useFakeTimers();

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
    clock = Date.now();
    sm = new BirdStateMachine();
    engine = new BehaviorEngine(sm, () => clock);
  });

  afterEach(() => {
    engine.destroy();
    sm.destroy();
    jest.clearAllTimers();
  });

  // ---------------------------------------------------------------------------
  // Activity to cat state mapping
  // ---------------------------------------------------------------------------
  describe('Activity to cat state mapping', () => {
    it('transitions cat to happy when activity is active_typing', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 5, 60));
      expect(sm.getCurrentState()).toBe('happy');
    });

    it('transitions cat to idle when activity is light_activity', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('happy');

      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 10));
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('transitions cat to nudging when activity is idle', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');
    });

    it('stays in happy on repeated active_typing updates', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 1, 50));
      engine.handleActivityUpdate(makeUpdate('active_typing', 2, 55));
      expect(sm.getCurrentState()).toBe('happy');
    });

    it('transitions from nudging back to happy on active_typing', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');

      engine.handleActivityUpdate(makeUpdate('active_typing', 1, 70));
      expect(sm.getCurrentState()).toBe('happy');
    });
  });

  // ---------------------------------------------------------------------------
  // Idle escalation to sleeping
  // ---------------------------------------------------------------------------
  describe('Idle escalation to sleeping', () => {
    it('transitions to sleeping after 300s of idle', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');

      clock += IDLE_SLEEP_THRESHOLD_MS;
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('does not sleep before 300s of idle', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');

      clock += IDLE_SLEEP_THRESHOLD_MS - 1;
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');
    });

    it('resets idle timer when activity resumes', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      clock += IDLE_SLEEP_THRESHOLD_MS / 2;

      // Activity resumes
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('happy');

      // Go idle again — timer should be reset
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      clock += IDLE_SLEEP_THRESHOLD_MS / 2;
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging'); // not sleeping yet
    });

    it('tick() also triggers sleep after 300s idle', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      clock += IDLE_SLEEP_THRESHOLD_MS;
      engine.tick();
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('wakes up to happy when typing resumes after sleeping', () => {
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      clock += IDLE_SLEEP_THRESHOLD_MS;
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('sleeping');

      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('happy');
    });
  });

  // ---------------------------------------------------------------------------
  // Stretch reminder
  // ---------------------------------------------------------------------------
  describe('Stretch reminder', () => {
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
  // Hydration reminder
  // ---------------------------------------------------------------------------
  describe('Hydration reminder', () => {
    it('shows hydration reminder every 60 min', () => {
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
  // Dismissal cooldown
  // ---------------------------------------------------------------------------
  describe('Dismissal cooldown', () => {
    it('suppresses re-nudge for 15 min after dismiss()', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');

      engine.dismiss();
      expect(engine.getActiveReminder()).toBeNull();

      clock += DISMISS_COOLDOWN_MS - 1;
      engine.handleActivityUpdate(makeUpdate('active_typing', 50, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('resumes reminders after the 15 min cooldown expires', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      engine.dismiss();

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
  });

  // ---------------------------------------------------------------------------
  // Integration
  // ---------------------------------------------------------------------------
  describe('Integration: behavior engine + state machine', () => {
    it('full workflow: typing → nudge → dismiss → cooldown → re-nudge', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      expect(sm.getCurrentState()).toBe('happy');

      engine.handleActivityUpdate(makeUpdate('active_typing', 45, 80));
      engine.tick();
      expect(sm.getCurrentState()).toBe('nudging');
      expect(engine.getActiveReminder()).toBe('Stretch a little?');

      engine.dismiss();
      expect(engine.getActiveReminder()).toBeNull();

      clock += DISMISS_COOLDOWN_MS / 2;
      engine.handleActivityUpdate(makeUpdate('active_typing', 50, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();

      clock += DISMISS_COOLDOWN_MS;
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

      expect(transitions.length).toBeGreaterThan(0);
    });

    it('state machine listeners fire for engine-driven transitions', () => {
      const spy = jest.fn();
      sm.onTransition(spy);

      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 80));
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ from: 'idle', to: 'happy' }));
    });

    it('destroy() cleans up without errors', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      engine.destroy();

      expect(() => engine.tick()).not.toThrow();
      expect(() => engine.dismiss()).not.toThrow();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('idle activity resets stretch tracking', () => {
      engine.handleActivityUpdate(makeUpdate('active_typing', 30, 80));
      engine.tick();
      expect(sm.getCurrentState()).not.toBe('nudging');

      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));

      engine.handleActivityUpdate(makeUpdate('active_typing', 10, 80));
      engine.tick();
      expect(engine.getActiveReminder()).toBeNull();
    });

    it('full idle escalation: typing → idle → nudge → sleep → wake', () => {
      // Typing → happy
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('happy');

      // Stop → idle
      engine.handleActivityUpdate(makeUpdate('light_activity', 0, 5));
      expect(sm.getCurrentState()).toBe('idle');

      // 10s no activity → nudging
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('nudging');

      // 300s no activity → sleeping
      clock += IDLE_SLEEP_THRESHOLD_MS;
      engine.handleActivityUpdate(makeUpdate('idle', 0, 0));
      expect(sm.getCurrentState()).toBe('sleeping');

      // Resume typing → happy
      engine.handleActivityUpdate(makeUpdate('active_typing', 0, 60));
      expect(sm.getCurrentState()).toBe('happy');
    });
  });
});
