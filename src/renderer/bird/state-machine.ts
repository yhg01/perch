import { BirdState, BirdStateTransition } from '../../shared/types';

type TransitionCallback = (transition: BirdStateTransition) => void;

/**
 * Defines which states each BirdState is allowed to transition to.
 */
const VALID_TRANSITIONS: Record<BirdState, ReadonlySet<BirdState>> = {
  idle: new Set<BirdState>(['sleeping', 'alert', 'nudging', 'happy', 'sad', 'idle']),
  sleeping: new Set<BirdState>(['idle', 'alert', 'nudging']),
  alert: new Set<BirdState>(['idle', 'sleeping', 'nudging', 'happy']),
  nudging: new Set<BirdState>(['idle', 'sleeping', 'happy', 'alert']),
  happy: new Set<BirdState>(['idle', 'sleeping', 'alert']),
  sad: new Set<BirdState>(['idle', 'happy']),
};

export class BirdStateMachine {
  private currentState: BirdState = 'idle';
  private previousState: BirdState = 'idle';
  private listeners: TransitionCallback[] = [];
  private returnTimer: ReturnType<typeof setTimeout> | null = null;

  public isTransitioning: boolean = false;

  constructor(initialState: BirdState = 'idle') {
    this.currentState = initialState;
    this.previousState = initialState;
  }

  /**
   * Returns the current bird state.
   */
  getCurrentState(): BirdState {
    return this.currentState;
  }

  /**
   * Returns the state that was active before the most recent transition.
   */
  getPreviousState(): BirdState {
    return this.previousState;
  }

  /**
   * Checks whether a transition from the current state to the target state is allowed.
   */
  canTransition(to: BirdState): boolean {
    if (to === this.currentState) {
      return false;
    }
    return VALID_TRANSITIONS[this.currentState].has(to);
  }

  /**
   * Validates and performs a state transition.
   *
   * Returns `true` if the transition was performed, `false` if it was invalid
   * or the machine is already in the target state.
   */
  transition(to: BirdState, trigger: string): boolean {
    if (to === this.currentState) {
      return false;
    }

    if (!this.canTransition(to)) {
      return false;
    }

    // Clear any pending return timer when an explicit transition occurs.
    this.clearReturnTimer();

    const from = this.currentState;
    this.previousState = from;
    this.currentState = to;
    this.isTransitioning = true;

    const transitionRecord: BirdStateTransition = { from, to, trigger };
    this.emitTransition(transitionRecord);

    // isTransitioning is set to true here; the consumer (animation layer) is
    // responsible for setting it back to false once the transition animation
    // finishes.  We do NOT auto-reset it because animation durations vary.

    return true;
  }

  /**
   * Registers a callback that will be invoked on every successful state transition.
   * Returns an unsubscribe function.
   */
  onTransition(callback: TransitionCallback): () => void {
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Schedules an automatic return to the previous state after `afterMs`
   * milliseconds. Useful for temporary states such as 'happy' after the user
   * clicks on the bird — the bird shows happiness briefly and then returns to
   * whatever it was doing before.
   *
   * If a return is already queued, the previous timer is cancelled and
   * replaced with the new one.
   */
  queueReturn(afterMs: number): void {
    this.clearReturnTimer();

    const targetState = this.previousState;

    this.returnTimer = setTimeout(() => {
      this.returnTimer = null;

      // Only return if we are still in the same state that queued the return.
      // If the user (or the system) already transitioned away, the queued
      // return is no longer meaningful.
      if (this.canTransition(targetState)) {
        this.transition(targetState, 'auto_return');
      }
    }, afterMs);
  }

  /**
   * Removes all registered transition listeners.
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Cleans up timers. Call this when the state machine is no longer needed.
   */
  destroy(): void {
    this.clearReturnTimer();
    this.removeAllListeners();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private clearReturnTimer(): void {
    if (this.returnTimer !== null) {
      clearTimeout(this.returnTimer);
      this.returnTimer = null;
    }
  }

  private emitTransition(transition: BirdStateTransition): void {
    for (const listener of this.listeners) {
      listener(transition);
    }
  }
}
