export type BirdState = 'idle' | 'sleeping' | 'nudging' | 'happy' | 'sad';

export type ActivityState = 'active_typing' | 'light_activity' | 'idle';

export interface ActivityUpdate {
  state: ActivityState;
  keystrokesPerWindow: number;
  continuousWorkMinutes: number;
}

export interface BirdStateTransition {
  from: BirdState;
  to: BirdState;
  trigger: string;
}
