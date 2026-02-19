import { BirdState } from '../../shared/types';

// Color palette
const BODY_COLOR = '#F4A460'; // sandy brown
const BELLY_COLOR = '#FFEFD5'; // papaya whip
const BEAK_COLOR = '#FF8C00'; // dark orange
const FEET_COLOR = '#FF8C00'; // dark orange
const EYE_COLOR = '#333';

/**
 * BirdSprite renders a placeholder bird character using basic canvas shapes.
 * The bird is approximately 64x80 pixels and has distinct visual appearances
 * for each BirdState.
 */
export class BirdSprite {
  private readonly width = 64;
  private readonly height = 80;

  /**
   * Draw the bird at (x, y) in the given state.
   * @param ctx  - Canvas 2D rendering context
   * @param x    - X coordinate (top-left of the bird's bounding box)
   * @param y    - Y coordinate (top-left of the bird's bounding box)
   * @param state - Current bird state determining visual appearance
   * @param frame - Frame counter used for animation offsets (e.g. breathing, bouncing)
   */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: BirdState, frame: number): void {
    ctx.save();
    ctx.translate(x, y);

    switch (state) {
      case 'idle':
        this.drawIdle(ctx, frame);
        break;
      case 'sleeping':
        this.drawSleeping(ctx, frame);
        break;
      case 'alert':
        this.drawAlert(ctx, frame);
        break;
      case 'nudging':
        this.drawNudging(ctx, frame);
        break;
      case 'happy':
        this.drawHappy(ctx, frame);
        break;
      case 'sad':
        this.drawSad(ctx, frame);
        break;
    }

    ctx.restore();
  }

  /** Normal bird, eyes open, gentle breathing animation. */
  private drawIdle(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.08) * 1.5;

    this.drawFeet(ctx, 0, 0);
    this.drawBody(ctx, 0, breathOffset);
    this.drawBelly(ctx, 0, breathOffset);
    this.drawWing(ctx, 0, breathOffset);
    this.drawHead(ctx, 0, breathOffset);
    this.drawEyesOpen(ctx, 0, breathOffset, 3);
    this.drawBeak(ctx, 0, breathOffset, false);
    this.drawTail(ctx, 0, breathOffset);
  }

  /** Eyes closed (horizontal lines), head tucked down, slow breathing. */
  private drawSleeping(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.04) * 1;

    this.drawFeet(ctx, 0, 0);
    this.drawBody(ctx, 0, breathOffset);
    this.drawBelly(ctx, 0, breathOffset);
    this.drawWing(ctx, 0, breathOffset);
    // Head tucked lower
    this.drawHead(ctx, 0, breathOffset + 4);
    this.drawEyesClosed(ctx, 0, breathOffset + 4);
    this.drawBeak(ctx, 0, breathOffset + 4, false);
    this.drawTail(ctx, 0, breathOffset);

    // Z's floating up
    this.drawZzz(ctx, frame);
  }

  /** Eyes wide (larger circles), body slightly upright. */
  private drawAlert(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.12) * 1;

    this.drawFeet(ctx, 0, 0);
    // Body shifted up slightly for upright posture
    this.drawBody(ctx, 0, breathOffset - 3);
    this.drawBelly(ctx, 0, breathOffset - 3);
    this.drawWing(ctx, 0, breathOffset - 3);
    this.drawHead(ctx, 0, breathOffset - 5);
    this.drawEyesOpen(ctx, 0, breathOffset - 5, 4.5); // wider eyes
    this.drawBeak(ctx, 0, breathOffset - 5, false);
    this.drawTail(ctx, 0, breathOffset - 3);
  }

  /** Leaning forward, beak open. */
  private drawNudging(ctx: CanvasRenderingContext2D, frame: number): void {
    const nudgeOffset = Math.sin(frame * 0.15) * 2;

    this.drawFeet(ctx, 0, 0);
    // Lean body forward
    this.drawBody(ctx, nudgeOffset + 3, 0);
    this.drawBelly(ctx, nudgeOffset + 3, 0);
    this.drawWing(ctx, nudgeOffset + 3, 0);
    // Head further forward
    this.drawHead(ctx, nudgeOffset + 6, -2);
    this.drawEyesOpen(ctx, nudgeOffset + 6, -2, 3);
    this.drawBeak(ctx, nudgeOffset + 6, -2, true); // beak open
    this.drawTail(ctx, nudgeOffset, 0);
  }

  /** Eyes as arcs (^_^), bouncing animation. */
  private drawHappy(ctx: CanvasRenderingContext2D, frame: number): void {
    const bounceOffset = -Math.abs(Math.sin(frame * 0.12)) * 6;

    this.drawFeet(ctx, 0, 0);
    this.drawBody(ctx, 0, bounceOffset);
    this.drawBelly(ctx, 0, bounceOffset);
    this.drawWingFlap(ctx, 0, bounceOffset, frame); // flapping wings when happy
    this.drawHead(ctx, 0, bounceOffset - 2);
    this.drawEyesHappy(ctx, 0, bounceOffset - 2);
    this.drawBeak(ctx, 0, bounceOffset - 2, false);
    this.drawTail(ctx, 0, bounceOffset);
  }

  /** Eyes droopy, slightly hunched posture. */
  private drawSad(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.05) * 0.8;

    this.drawFeet(ctx, 0, 0);
    // Hunched: body slightly lower and forward
    this.drawBody(ctx, 2, breathOffset + 3);
    this.drawBelly(ctx, 2, breathOffset + 3);
    this.drawWing(ctx, 2, breathOffset + 3);
    this.drawHead(ctx, 3, breathOffset + 5);
    this.drawEyesDroopy(ctx, 3, breathOffset + 5);
    this.drawBeak(ctx, 3, breathOffset + 5, false);
    this.drawTail(ctx, 0, breathOffset + 3);
  }

  // ---------------------------------------------------------------------------
  // Component drawing helpers
  // ---------------------------------------------------------------------------

  /** Draw the main body ellipse. */
  private drawBody(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 32 + dx;
    const cy = 50 + dy;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw the lighter belly patch. */
  private drawBelly(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 34 + dx;
    const cy = 54 + dy;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = BELLY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw the head circle. */
  private drawHead(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 36 + dx;
    const cy = 28 + dy;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw open eyes (circles) with configurable radius. */
  private drawEyesOpen(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    radius: number,
  ): void {
    const baseY = 26 + dy;
    const leftX = 32 + dx;
    const rightX = 41 + dx;

    ctx.fillStyle = EYE_COLOR;

    // Left eye
    ctx.beginPath();
    ctx.arc(leftX, baseY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Right eye
    ctx.beginPath();
    ctx.arc(rightX, baseY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Pupils (white highlights)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(leftX + 1, baseY - 1, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(rightX + 1, baseY - 1, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  /** Draw closed eyes (horizontal lines) for sleeping. */
  private drawEyesClosed(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 26 + dy;
    const leftX = 30 + dx;
    const rightX = 39 + dx;

    ctx.strokeStyle = EYE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Left eye — horizontal line
    ctx.beginPath();
    ctx.moveTo(leftX - 3, baseY);
    ctx.lineTo(leftX + 3, baseY);
    ctx.stroke();

    // Right eye — horizontal line
    ctx.beginPath();
    ctx.moveTo(rightX - 3, baseY);
    ctx.lineTo(rightX + 3, baseY);
    ctx.stroke();
  }

  /** Draw happy eyes (^_^ arcs) for the happy state. */
  private drawEyesHappy(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 27 + dy;
    const leftX = 31 + dx;
    const rightX = 40 + dx;

    ctx.strokeStyle = EYE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Left eye — upward arc (^ shape)
    ctx.beginPath();
    ctx.arc(leftX, baseY + 2, 4, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    // Right eye — upward arc (^ shape)
    ctx.beginPath();
    ctx.arc(rightX, baseY + 2, 4, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }

  /** Draw droopy eyes for the sad state. */
  private drawEyesDroopy(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 27 + dy;
    const leftX = 31 + dx;
    const rightX = 40 + dx;

    ctx.fillStyle = EYE_COLOR;

    // Smaller, lower-positioned eyes
    ctx.beginPath();
    ctx.ellipse(leftX, baseY + 1, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.ellipse(rightX, baseY + 1, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Droopy eyelid lines (angled down on the outside)
    ctx.strokeStyle = BODY_COLOR;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Left eyelid — slopes down to the left
    ctx.beginPath();
    ctx.moveTo(leftX - 3, baseY - 2);
    ctx.lineTo(leftX + 3, baseY);
    ctx.stroke();

    // Right eyelid — slopes down to the right
    ctx.beginPath();
    ctx.moveTo(rightX - 3, baseY);
    ctx.lineTo(rightX + 3, baseY - 2);
    ctx.stroke();
  }

  /** Draw the beak. When `open` is true, draw it with an open mouth. */
  private drawBeak(ctx: CanvasRenderingContext2D, dx: number, dy: number, open: boolean): void {
    const bx = 48 + dx;
    const by = 28 + dy;

    ctx.fillStyle = BEAK_COLOR;

    if (open) {
      // Upper beak
      ctx.beginPath();
      ctx.moveTo(bx, by - 2);
      ctx.lineTo(bx + 10, by - 1);
      ctx.lineTo(bx, by + 1);
      ctx.closePath();
      ctx.fill();

      // Lower beak (angled down)
      ctx.beginPath();
      ctx.moveTo(bx, by + 2);
      ctx.lineTo(bx + 8, by + 5);
      ctx.lineTo(bx, by + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Closed beak — single triangle
      ctx.beginPath();
      ctx.moveTo(bx, by - 2);
      ctx.lineTo(bx + 10, by + 1);
      ctx.lineTo(bx, by + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** Draw a static folded wing on the body. */
  private drawWing(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const wx = 18 + dx;
    const wy = 44 + dy;

    ctx.beginPath();
    ctx.ellipse(wx, wy, 10, 14, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = this.darken(BODY_COLOR, 20);
    ctx.fill();
    ctx.closePath();
  }

  /** Draw a flapping wing for the happy state. */
  private drawWingFlap(ctx: CanvasRenderingContext2D, dx: number, dy: number, frame: number): void {
    const wx = 18 + dx;
    const wy = 44 + dy;
    const flapAngle = Math.sin(frame * 0.25) * 0.6 - 0.3;

    ctx.save();
    ctx.translate(wx + 8, wy);
    ctx.rotate(flapAngle);

    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.darken(BODY_COLOR, 20);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  /** Draw the tail feathers behind the body. */
  private drawTail(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const tx = 10 + dx;
    const ty = 52 + dy;

    ctx.fillStyle = this.darken(BODY_COLOR, 15);

    // Three small tail feather shapes
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(tx - 4, ty + i * 4, 8, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
  }

  /** Draw the feet/legs. */
  private drawFeet(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 68 + dy;

    ctx.strokeStyle = FEET_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(28 + dx, 62);
    ctx.lineTo(26 + dx, baseY);
    ctx.stroke();

    // Left foot toes
    ctx.beginPath();
    ctx.moveTo(22 + dx, baseY + 3);
    ctx.lineTo(26 + dx, baseY);
    ctx.lineTo(30 + dx, baseY + 3);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(38 + dx, 62);
    ctx.lineTo(40 + dx, baseY);
    ctx.stroke();

    // Right foot toes
    ctx.beginPath();
    ctx.moveTo(36 + dx, baseY + 3);
    ctx.lineTo(40 + dx, baseY);
    ctx.lineTo(44 + dx, baseY + 3);
    ctx.stroke();
  }

  /** Draw floating "Z" letters for sleeping state. */
  private drawZzz(ctx: CanvasRenderingContext2D, frame: number): void {
    const phase = (frame * 0.03) % 1;

    ctx.fillStyle = EYE_COLOR;
    ctx.globalAlpha = 0.5;

    const sizes = [8, 10, 12];
    for (let i = 0; i < 3; i++) {
      const zPhase = (phase + i * 0.33) % 1;
      const zx = 50 + i * 4;
      const zy = 20 - zPhase * 20;
      const alpha = 1 - zPhase;
      const size = sizes[i];

      ctx.globalAlpha = alpha * 0.6;
      ctx.font = `bold ${size}px sans-serif`;
      ctx.fillText('z', zx, zy);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Darken a hex color by a given amount (0-255).
   * Returns a new hex color string.
   */
  private darken(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
    const b = Math.max(0, (num & 0x0000ff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /** Get the width of the bird sprite. */
  getWidth(): number {
    return this.width;
  }

  /** Get the height of the bird sprite. */
  getHeight(): number {
    return this.height;
  }
}
