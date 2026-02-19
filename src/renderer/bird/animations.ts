import { BirdState } from '../../shared/types';
import { BirdSprite } from './sprites';
import { BirdStateMachine } from './state-machine';

/**
 * Manages the animation loop and coordinates between the sprite renderer
 * and state machine.
 */
export class BirdAnimator {
  private sprite: BirdSprite;
  private stateMachine: BirdStateMachine;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private frameCount: number = 0;
  private animationId: number | null = null;
  private transitionFrames: number = 0;
  private readonly TRANSITION_DURATION = 15; // frames for transition blend

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    stateMachine: BirdStateMachine,
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.sprite = new BirdSprite();
    this.stateMachine = stateMachine;

    this.stateMachine.onTransition(() => {
      this.transitionFrames = this.TRANSITION_DURATION;
    });
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    this.frameCount++;

    // Handle transition animation counter
    if (this.transitionFrames > 0) {
      this.transitionFrames--;
      if (this.transitionFrames === 0) {
        this.stateMachine.isTransitioning = false;
      }
    }

    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const state = this.stateMachine.getCurrentState();
    const birdX = (this.canvas.width - this.sprite.getWidth()) / 2;
    const birdY = (this.canvas.height - this.sprite.getHeight()) / 2;

    // Apply fade transition if transitioning
    if (this.transitionFrames > 0) {
      const progress = 1 - this.transitionFrames / this.TRANSITION_DURATION;
      this.ctx.globalAlpha = 0.5 + progress * 0.5;
    }

    this.sprite.draw(this.ctx, birdX, birdY, state, this.frameCount);
    this.ctx.globalAlpha = 1;
  }

  getStateMachine(): BirdStateMachine {
    return this.stateMachine;
  }

  getCurrentState(): BirdState {
    return this.stateMachine.getCurrentState();
  }
}
