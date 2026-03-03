import { ipcRenderer } from 'electron';
import { BirdStateMachine } from './bird/state-machine';
import { BirdAnimator } from './bird/animations';
import { BehaviorEngine } from './bird/behavior-engine';

const canvas = document.getElementById('bird-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Initialize state machine, behavior engine, and animator
const stateMachine = new BirdStateMachine();
const behaviorEngine = new BehaviorEngine(stateMachine);
const animator = new BirdAnimator(canvas, ctx, stateMachine);

// Start animation loop
animator.start();

// Tick the behavior engine every second for time-based checks
setInterval(() => {
  behaviorEngine.tick();
}, 1000);

// Handle click on the cat — play happy animation or dismiss reminder
canvas.addEventListener('click', () => {
  if (behaviorEngine.getActiveReminder()) {
    behaviorEngine.dismiss();
  } else if (stateMachine.getCurrentState() !== 'happy') {
    stateMachine.transition('happy', 'user_click');
    stateMachine.queueReturn(2000);
  }
});

// Make the cat area respond to mouse events (not click-through)
canvas.addEventListener('mouseenter', () => {
  ipcRenderer.send('set-ignore-mouse', false);
});

canvas.addEventListener('mouseleave', () => {
  ipcRenderer.send('set-ignore-mouse', true);
});

// Listen for activity state updates from main process
ipcRenderer.on('activity-update', (_event, data) => {
  behaviorEngine.handleActivityUpdate(data);
});

// Handle opacity transitions for smooth show/hide
let opacityTarget = 1;
let currentOpacity = 1;

ipcRenderer.on('opacity-transition', (_event, direction: string) => {
  opacityTarget = direction === 'show' ? 1 : 0;
  animateOpacity();
});

function animateOpacity(): void {
  const step = opacityTarget > currentOpacity ? 0.05 : -0.05;
  currentOpacity += step;
  currentOpacity = Math.max(0, Math.min(1, currentOpacity));

  document.body.style.opacity = String(currentOpacity);

  if (Math.abs(currentOpacity - opacityTarget) > 0.01) {
    requestAnimationFrame(animateOpacity);
  } else {
    currentOpacity = opacityTarget;
    document.body.style.opacity = String(currentOpacity);
  }
}
