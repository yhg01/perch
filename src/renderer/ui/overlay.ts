import { BIRD_SIZE } from '../../shared/constants';

/** Duration (in frames at 60 fps) for the fade-in / fade-out animation. */
const FADE_FRAMES = 20;

/** Padding inside the tooltip bubble. */
const BUBBLE_PAD_X = 12;
const BUBBLE_PAD_Y = 8;

/** Corner radius for the rounded tooltip rectangle. */
const BUBBLE_RADIUS = 8;

/** Vertical offset above the bird sprite where the tooltip is drawn. */
const BUBBLE_OFFSET_Y = 16;

/** Font used inside the tooltip. */
const TOOLTIP_FONT = '13px system-ui, -apple-system, sans-serif';

/** Background colour of the tooltip bubble. */
const BUBBLE_BG = 'rgba(50, 50, 60, 0.92)';

/** Text colour inside the tooltip. */
const BUBBLE_TEXT = '#f0f0f0';

/** Colour of the small triangle pointer beneath the bubble. */
const POINTER_SIZE = 6;

type DismissCallback = () => void;

/**
 * Overlay draws a tooltip bubble on the bird canvas and manages fade
 * animations for showing / hiding reminder messages.
 */
export class Overlay {
  private message: string = '';
  private visible: boolean = false;
  private opacity: number = 0;
  private dismissCallbacks: DismissCallback[] = [];

  /**
   * Whether the overlay is currently visible or fading in / out.
   */
  get isVisible(): boolean {
    return this.visible || this.opacity > 0;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Show a tooltip with the given message. Triggers a fade-in animation.
   */
  show(message: string): void {
    this.message = message;
    this.visible = true;
  }

  /**
   * Hide the tooltip. Triggers a fade-out animation; once opacity reaches 0 the
   * overlay is fully dismissed and all registered dismiss callbacks fire.
   */
  hide(): void {
    this.visible = false;
  }

  /**
   * Register a callback to be invoked when the overlay finishes hiding.
   * Returns an unsubscribe function.
   */
  onDismiss(callback: DismissCallback): () => void {
    this.dismissCallbacks.push(callback);

    return () => {
      const idx = this.dismissCallbacks.indexOf(callback);
      if (idx !== -1) {
        this.dismissCallbacks.splice(idx, 1);
      }
    };
  }

  /**
   * Draw the tooltip bubble on the provided canvas context.
   *
   * @param ctx  - The 2D rendering context of the canvas.
   * @param x    - X centre of the bird sprite (tooltip is centred above it).
   * @param y    - Y top of the bird sprite.
   * @param frame - The current animation frame counter (used for fade timing).
   */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, _frame: number): void {
    // Advance fade animation each draw call.
    this.advanceFade();

    if (this.opacity <= 0) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Measure text to determine bubble dimensions.
    ctx.font = TOOLTIP_FONT;
    const metrics = ctx.measureText(this.message);
    const textWidth = metrics.width;
    const textHeight = 14; // approximate line height for 13px font

    const bubbleWidth = textWidth + BUBBLE_PAD_X * 2;
    const bubbleHeight = textHeight + BUBBLE_PAD_Y * 2;

    // Position the bubble centred above the bird sprite.
    const birdCenterX = x + BIRD_SIZE / 2;
    const bubbleX = birdCenterX - bubbleWidth / 2;
    const bubbleY = y - bubbleHeight - BUBBLE_OFFSET_Y - POINTER_SIZE;

    // Draw rounded rectangle bubble.
    this.drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, BUBBLE_RADIUS);
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();

    // Draw the small triangle pointer below the bubble.
    ctx.beginPath();
    ctx.moveTo(birdCenterX - POINTER_SIZE, bubbleY + bubbleHeight);
    ctx.lineTo(birdCenterX, bubbleY + bubbleHeight + POINTER_SIZE);
    ctx.lineTo(birdCenterX + POINTER_SIZE, bubbleY + bubbleHeight);
    ctx.closePath();
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();

    // Draw the message text.
    ctx.fillStyle = BUBBLE_TEXT;
    ctx.font = TOOLTIP_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.message, birdCenterX, bubbleY + bubbleHeight / 2);

    ctx.restore();
  }

  /**
   * Remove all dismiss callbacks. Call when the overlay is no longer needed.
   */
  destroy(): void {
    this.dismissCallbacks = [];
    this.visible = false;
    this.opacity = 0;
    this.message = '';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Step the opacity towards its target value (1 when visible, 0 when hidden).
   * When fading out completes, fire dismiss callbacks.
   */
  private advanceFade(): void {
    const step = 1 / FADE_FRAMES;

    if (this.visible) {
      this.opacity = Math.min(1, this.opacity + step);
    } else {
      const prevOpacity = this.opacity;
      this.opacity = Math.max(0, this.opacity - step);

      // Fire dismiss callbacks once fade-out completes.
      if (prevOpacity > 0 && this.opacity <= 0) {
        this.fireDismissCallbacks();
      }
    }
  }

  /**
   * Draw a rounded rectangle path (does NOT fill or stroke — caller is
   * responsible for that).
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private fireDismissCallbacks(): void {
    for (const cb of this.dismissCallbacks) {
      cb();
    }
  }
}
