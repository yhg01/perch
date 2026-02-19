import { ipcRenderer } from 'electron';
import { BirdStateMachine } from './bird/state-machine';
import { BirdAnimator } from './bird/animations';

const canvas = document.getElementById('bird-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Initialize state machine and animator
const stateMachine = new BirdStateMachine();
const animator = new BirdAnimator(canvas, ctx, stateMachine);

// Start animation loop
animator.start();

// Handle click on the bird — play happy animation then return
canvas.addEventListener('click', () => {
  if (stateMachine.getCurrentState() !== 'happy') {
    stateMachine.transition('happy', 'user_click');
    stateMachine.queueReturn(2000); // Return to previous state after 2s
  }
});

// Make the bird area respond to mouse events (not click-through)
canvas.addEventListener('mouseenter', () => {
  ipcRenderer.send('set-ignore-mouse', false);
});

canvas.addEventListener('mouseleave', () => {
  ipcRenderer.send('set-ignore-mouse', true);
});

// Listen for activity state updates from main process
ipcRenderer.on('activity-update', (_event, data) => {
  const { state } = data;
  switch (state) {
    case 'active_typing':
      stateMachine.transition('sleeping', 'active_typing');
      break;
    case 'light_activity':
      stateMachine.transition('idle', 'light_activity');
      break;
    case 'idle':
      stateMachine.transition('alert', 'user_idle');
      break;
  }
});
