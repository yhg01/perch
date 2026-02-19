import { BirdStateMachine } from './state-machine';

describe('BirdStateMachine', () => {
  let sm: BirdStateMachine;

  beforeEach(() => {
    sm = new BirdStateMachine();
  });

  afterEach(() => {
    sm.destroy();
  });

  describe('initial state', () => {
    it('starts in idle state', () => {
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('accepts a custom initial state', () => {
      const sm2 = new BirdStateMachine('sleeping');
      expect(sm2.getCurrentState()).toBe('sleeping');
      sm2.destroy();
    });

    it('has isTransitioning set to false initially', () => {
      expect(sm.isTransitioning).toBe(false);
    });
  });

  describe('transition validation', () => {
    it('allows idle -> sleeping', () => {
      expect(sm.canTransition('sleeping')).toBe(true);
    });

    it('allows idle -> alert', () => {
      expect(sm.canTransition('alert')).toBe(true);
    });

    it('allows idle -> nudging', () => {
      expect(sm.canTransition('nudging')).toBe(true);
    });

    it('allows idle -> happy', () => {
      expect(sm.canTransition('happy')).toBe(true);
    });

    it('allows idle -> sad', () => {
      expect(sm.canTransition('sad')).toBe(true);
    });

    it('does not allow same-state transition', () => {
      expect(sm.canTransition('idle')).toBe(false);
    });

    it('allows sleeping -> nudging', () => {
      sm.transition('sleeping', 'test');
      expect(sm.canTransition('nudging')).toBe(true);
    });

    it('allows sleeping -> idle', () => {
      sm.transition('sleeping', 'test');
      expect(sm.canTransition('idle')).toBe(true);
    });

    it('allows sleeping -> alert', () => {
      sm.transition('sleeping', 'test');
      expect(sm.canTransition('alert')).toBe(true);
    });

    it('does not allow sad -> nudging', () => {
      sm.transition('sad', 'test');
      expect(sm.canTransition('nudging')).toBe(false);
    });

    it('allows sad -> happy', () => {
      sm.transition('sad', 'test');
      expect(sm.canTransition('happy')).toBe(true);
    });
  });

  describe('transition execution', () => {
    it('transitions successfully for valid transitions', () => {
      const result = sm.transition('sleeping', 'test');
      expect(result).toBe(true);
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('returns false for invalid transitions', () => {
      sm.transition('sleeping', 'test');
      const result = sm.transition('happy', 'test');
      expect(result).toBe(false);
      expect(sm.getCurrentState()).toBe('sleeping');
    });

    it('returns false for same-state transitions', () => {
      const result = sm.transition('idle', 'test');
      expect(result).toBe(false);
    });

    it('sets isTransitioning to true on transition', () => {
      sm.transition('alert', 'test');
      expect(sm.isTransitioning).toBe(true);
    });

    it('tracks previous state', () => {
      sm.transition('sleeping', 'test');
      expect(sm.getPreviousState()).toBe('idle');

      sm.transition('idle', 'test');
      expect(sm.getPreviousState()).toBe('sleeping');
    });
  });

  describe('transition events', () => {
    it('calls listener on transition', () => {
      const callback = jest.fn();
      sm.onTransition(callback);

      sm.transition('alert', 'test_trigger');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        from: 'idle',
        to: 'alert',
        trigger: 'test_trigger',
      });
    });

    it('does not call listener on invalid transition', () => {
      const callback = jest.fn();
      sm.onTransition(callback);

      sm.transition('sleeping', 'test');
      callback.mockClear();

      sm.transition('happy', 'test'); // invalid from sleeping

      expect(callback).not.toHaveBeenCalled();
    });

    it('supports unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = sm.onTransition(callback);

      sm.transition('alert', 'test');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      sm.transition('idle', 'test');
      expect(callback).toHaveBeenCalledTimes(1); // not called again
    });

    it('supports removeAllListeners', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      sm.onTransition(cb1);
      sm.onTransition(cb2);

      sm.removeAllListeners();
      sm.transition('alert', 'test');

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  describe('queueReturn', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns to previous state after delay', () => {
      sm.transition('happy', 'click');
      sm.queueReturn(2000);

      expect(sm.getCurrentState()).toBe('happy');

      jest.advanceTimersByTime(2000);

      expect(sm.getCurrentState()).toBe('idle');
    });

    it('cancels previous return timer when new one is queued', () => {
      sm.transition('happy', 'click');
      sm.queueReturn(2000);

      jest.advanceTimersByTime(1000);
      sm.queueReturn(3000); // reset timer

      jest.advanceTimersByTime(2500);
      expect(sm.getCurrentState()).toBe('happy'); // still happy

      jest.advanceTimersByTime(1000);
      expect(sm.getCurrentState()).toBe('idle'); // now returned
    });

    it('does not return if state changed before timer fires', () => {
      sm.transition('happy', 'click');
      sm.queueReturn(2000);

      // Manually transition to alert before timer fires
      sm.transition('alert', 'other');

      jest.advanceTimersByTime(2000);

      // Should stay alert, not go back to idle
      expect(sm.getCurrentState()).toBe('alert');
    });
  });

  describe('multi-step transitions', () => {
    it('handles idle -> alert -> nudging -> idle flow', () => {
      expect(sm.transition('alert', 'user_idle')).toBe(true);
      expect(sm.getCurrentState()).toBe('alert');

      expect(sm.transition('nudging', 'reminder')).toBe(true);
      expect(sm.getCurrentState()).toBe('nudging');

      expect(sm.transition('idle', 'dismissed')).toBe(true);
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('handles click happy during alert', () => {
      sm.transition('alert', 'user_idle');
      sm.transition('happy', 'user_click');
      expect(sm.getCurrentState()).toBe('happy');
      expect(sm.getPreviousState()).toBe('alert');
    });
  });
});
