import { BirdState } from '../../shared/types';

// Color palette — orange tabby cat with white patches
const BODY_COLOR = '#FF8C40'; // warm orange
const BODY_DARK = '#E07020'; // darker orange for stripes/shadow
const BELLY_COLOR = '#FFFFFF'; // white chest & belly
const EAR_INNER = '#FFB3B3'; // pink inner ear
const NOSE_COLOR = '#FF8888'; // pink nose
const EYE_COLOR = '#333333'; // dark eyes
const WHISKER_COLOR = '#555555'; // whisker gray
const PAW_COLOR = '#FFFFFF'; // white paws

/**
 * BirdSprite renders a cute orange-and-white cat character using basic canvas shapes.
 * The cat is approximately 64x80 pixels and has distinct visual appearances
 * for each BirdState.
 */
export class BirdSprite {
  private readonly width = 64;
  private readonly height = 80;

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

  /** Sitting cat, gentle breathing, tail swaying. */
  private drawIdle(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.08) * 1.5;
    const tailSway = Math.sin(frame * 0.06) * 0.3;

    this.drawTail(ctx, 0, breathOffset, tailSway);
    this.drawBody(ctx, 0, breathOffset);
    this.drawBellyPatch(ctx, 0, breathOffset);
    this.drawPaws(ctx, 0, breathOffset);
    this.drawHead(ctx, 0, breathOffset);
    this.drawEars(ctx, 0, breathOffset, 0);
    this.drawEyesOpen(ctx, 0, breathOffset, 3.5);
    this.drawNose(ctx, 0, breathOffset);
    this.drawMouth(ctx, 0, breathOffset, false);
    this.drawWhiskers(ctx, 0, breathOffset);
    this.drawStripes(ctx, 0, breathOffset);
  }

  /** Curled up, eyes closed, slow breathing, Z's floating. */
  private drawSleeping(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.04) * 1;

    this.drawTail(ctx, 4, breathOffset + 2, 0);
    this.drawBody(ctx, 0, breathOffset + 2);
    this.drawBellyPatch(ctx, 0, breathOffset + 2);
    this.drawPaws(ctx, 0, breathOffset + 2);
    // Head tucked down
    this.drawHead(ctx, 0, breathOffset + 5);
    this.drawEars(ctx, 0, breathOffset + 5, -0.15);
    this.drawEyesClosed(ctx, 0, breathOffset + 5);
    this.drawNose(ctx, 0, breathOffset + 5);
    this.drawMouth(ctx, 0, breathOffset + 5, false);
    this.drawWhiskers(ctx, 0, breathOffset + 5);

    this.drawZzz(ctx, frame);
  }

  /** Ears perked, wide eyes, tail up straight. */
  private drawAlert(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.12) * 1;

    this.drawTailUp(ctx, 0, breathOffset - 2);
    this.drawBody(ctx, 0, breathOffset - 2);
    this.drawBellyPatch(ctx, 0, breathOffset - 2);
    this.drawPaws(ctx, 0, breathOffset - 2);
    this.drawHead(ctx, 0, breathOffset - 4);
    this.drawEars(ctx, 0, breathOffset - 4, 0.1); // ears perked wider
    this.drawEyesWide(ctx, 0, breathOffset - 4);
    this.drawNose(ctx, 0, breathOffset - 4);
    this.drawMouth(ctx, 0, breathOffset - 4, false);
    this.drawWhiskers(ctx, 0, breathOffset - 4);
    this.drawStripes(ctx, 0, breathOffset - 2);
  }

  /** Leaning forward with one paw up, mouth open (meowing). */
  private drawNudging(ctx: CanvasRenderingContext2D, frame: number): void {
    const nudgeOffset = Math.sin(frame * 0.15) * 2;

    this.drawTail(ctx, 0, 0, Math.sin(frame * 0.1) * 0.2);
    this.drawBody(ctx, nudgeOffset + 2, 0);
    this.drawBellyPatch(ctx, nudgeOffset + 2, 0);
    this.drawPawRaised(ctx, nudgeOffset + 4, -2, frame);
    this.drawPawSingle(ctx, nudgeOffset + 2, 0, false); // back paw stays
    this.drawHead(ctx, nudgeOffset + 5, -2);
    this.drawEars(ctx, nudgeOffset + 5, -2, 0);
    this.drawEyesOpen(ctx, nudgeOffset + 5, -2, 3.5);
    this.drawNose(ctx, nudgeOffset + 5, -2);
    this.drawMouth(ctx, nudgeOffset + 5, -2, true); // mouth open — meow!
    this.drawWhiskers(ctx, nudgeOffset + 5, -2);
  }

  /** Bouncing, ^_^ eyes, tail wagging fast. */
  private drawHappy(ctx: CanvasRenderingContext2D, frame: number): void {
    const bounceOffset = -Math.abs(Math.sin(frame * 0.12)) * 6;
    const tailWag = Math.sin(frame * 0.25) * 0.5;

    this.drawTail(ctx, 0, bounceOffset, tailWag);
    this.drawBody(ctx, 0, bounceOffset);
    this.drawBellyPatch(ctx, 0, bounceOffset);
    this.drawPaws(ctx, 0, bounceOffset);
    this.drawHead(ctx, 0, bounceOffset - 2);
    this.drawEars(ctx, 0, bounceOffset - 2, 0);
    this.drawEyesHappy(ctx, 0, bounceOffset - 2);
    this.drawNose(ctx, 0, bounceOffset - 2);
    this.drawMouth(ctx, 0, bounceOffset - 2, false);
    this.drawWhiskers(ctx, 0, bounceOffset - 2);
    this.drawStripes(ctx, 0, bounceOffset);
  }

  /** Ears flat, droopy eyes, tail tucked. */
  private drawSad(ctx: CanvasRenderingContext2D, frame: number): void {
    const breathOffset = Math.sin(frame * 0.05) * 0.8;

    this.drawTail(ctx, 3, breathOffset + 3, 0);
    this.drawBody(ctx, 1, breathOffset + 2);
    this.drawBellyPatch(ctx, 1, breathOffset + 2);
    this.drawPaws(ctx, 1, breathOffset + 2);
    this.drawHead(ctx, 2, breathOffset + 4);
    this.drawEars(ctx, 2, breathOffset + 4, -0.25); // ears flattened
    this.drawEyesDroopy(ctx, 2, breathOffset + 4);
    this.drawNose(ctx, 2, breathOffset + 4);
    this.drawMouth(ctx, 2, breathOffset + 4, false);
    this.drawWhiskers(ctx, 2, breathOffset + 4);
  }

  // ---------------------------------------------------------------------------
  // Component drawing helpers
  // ---------------------------------------------------------------------------

  /** Draw the main body — a plump sitting-cat ellipse. */
  private drawBody(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 32 + dx;
    const cy = 52 + dy;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw the white belly/chest patch. */
  private drawBellyPatch(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 33 + dx;
    const cy = 55 + dy;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 11, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = BELLY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw the round head. */
  private drawHead(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 34 + dx;
    const cy = 28 + dy;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLOR;
    ctx.fill();
    ctx.closePath();

    // White muzzle area
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy + 6, 8, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = BELLY_COLOR;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw two pointy triangular ears with pink inner ear. */
  private drawEars(ctx: CanvasRenderingContext2D, dx: number, dy: number, flatAngle: number): void {
    const headCx = 34 + dx;
    const headTop = 14 + dy;

    // Left ear
    ctx.save();
    ctx.translate(headCx - 10, headTop + 2);
    ctx.rotate(-0.2 + flatAngle);
    this.drawSingleEar(ctx);
    ctx.restore();

    // Right ear
    ctx.save();
    ctx.translate(headCx + 10, headTop + 2);
    ctx.rotate(0.2 - flatAngle);
    ctx.scale(-1, 1);
    this.drawSingleEar(ctx);
    ctx.restore();
  }

  /** Draw one ear (pointing up, anchored at bottom-center). */
  private drawSingleEar(ctx: CanvasRenderingContext2D): void {
    // Outer ear (orange)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, -14);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fillStyle = BODY_COLOR;
    ctx.fill();

    // Inner ear (pink)
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(-4, -11);
    ctx.lineTo(4, -1);
    ctx.closePath();
    ctx.fillStyle = EAR_INNER;
    ctx.fill();
  }

  /** Draw open eyes with vertical slit pupils. */
  private drawEyesOpen(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    radius: number,
  ): void {
    const baseY = 26 + dy;
    const leftX = 28 + dx;
    const rightX = 40 + dx;

    // White of eyes
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath();
    ctx.ellipse(leftX, baseY, radius + 0.5, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.ellipse(rightX, baseY, radius + 0.5, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Iris (green-gold, cat-like)
    const irisR = radius * 0.8;
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(leftX, baseY, irisR, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX, baseY, irisR, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Vertical slit pupil
    ctx.fillStyle = EYE_COLOR;
    ctx.beginPath();
    ctx.ellipse(leftX, baseY, 1, irisR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.ellipse(rightX, baseY, 1, irisR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(leftX + 1.5, baseY - 1.5, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX + 1.5, baseY - 1.5, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  /** Draw wide alert eyes — larger iris, round pupils. */
  private drawEyesWide(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 26 + dy;
    const leftX = 28 + dx;
    const rightX = 40 + dx;
    const radius = 4.5;

    // White of eyes
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath();
    ctx.ellipse(leftX, baseY, radius + 0.5, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.ellipse(rightX, baseY, radius + 0.5, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Large iris
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(leftX, baseY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX, baseY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Round dilated pupils (alert = dilated)
    ctx.fillStyle = EYE_COLOR;
    ctx.beginPath();
    ctx.arc(leftX, baseY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX, baseY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(leftX + 1.5, baseY - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX + 1.5, baseY - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  /** Draw closed eyes (curved lines) for sleeping. */
  private drawEyesClosed(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 27 + dy;
    const leftX = 28 + dx;
    const rightX = 40 + dx;

    ctx.strokeStyle = EYE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // Left eye — gentle downward curve
    ctx.beginPath();
    ctx.arc(leftX, baseY + 2, 3.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Right eye — gentle downward curve
    ctx.beginPath();
    ctx.arc(rightX, baseY + 2, 3.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  /** Draw happy eyes (^_^ arcs). */
  private drawEyesHappy(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 27 + dy;
    const leftX = 28 + dx;
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

  /** Draw droopy sad eyes. */
  private drawEyesDroopy(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const baseY = 27 + dy;
    const leftX = 28 + dx;
    const rightX = 40 + dx;

    // Smaller, sadder eyes
    ctx.fillStyle = '#FFFFEE';
    ctx.beginPath();
    ctx.ellipse(leftX, baseY, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.ellipse(rightX, baseY, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(leftX, baseY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(rightX, baseY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = EYE_COLOR;
    ctx.beginPath();
    ctx.ellipse(leftX, baseY, 0.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.ellipse(rightX, baseY, 0.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Droopy eyelid lines (angled down on the outside)
    ctx.strokeStyle = BODY_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(leftX - 3, baseY - 2.5);
    ctx.lineTo(leftX + 3, baseY - 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX - 3, baseY - 1);
    ctx.lineTo(rightX + 3, baseY - 2.5);
    ctx.stroke();
  }

  /** Draw the small pink triangle nose. */
  private drawNose(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const nx = 34 + dx;
    const ny = 32 + dy;

    ctx.fillStyle = NOSE_COLOR;
    ctx.beginPath();
    ctx.moveTo(nx, ny - 2);
    ctx.lineTo(nx - 2.5, ny + 1.5);
    ctx.lineTo(nx + 2.5, ny + 1.5);
    ctx.closePath();
    ctx.fill();
  }

  /** Draw the cat mouth — "w" shape. If open, wider for meowing. */
  private drawMouth(ctx: CanvasRenderingContext2D, dx: number, dy: number, open: boolean): void {
    const mx = 34 + dx;
    const my = 34.5 + dy;

    ctx.strokeStyle = EYE_COLOR;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';

    if (open) {
      // Open mouth — oval
      ctx.beginPath();
      ctx.ellipse(mx, my + 1, 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#CC5555';
      ctx.fill();
      ctx.closePath();
    } else {
      // Closed "w" mouth
      ctx.beginPath();
      ctx.moveTo(mx - 3, my);
      ctx.quadraticCurveTo(mx - 1.5, my + 2, mx, my);
      ctx.quadraticCurveTo(mx + 1.5, my + 2, mx + 3, my);
      ctx.stroke();
    }
  }

  /** Draw 3 whiskers on each side. */
  private drawWhiskers(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 34 + dx;
    const cy = 32 + dy;

    ctx.strokeStyle = WHISKER_COLOR;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';

    const whiskerLen = 12;
    const angles = [-0.15, 0, 0.15]; // slight spread

    // Left whiskers
    for (const angle of angles) {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 1);
      ctx.lineTo(cx - 6 - whiskerLen, cy + 1 + angle * whiskerLen);
      ctx.stroke();
    }

    // Right whiskers
    for (const angle of angles) {
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 1);
      ctx.lineTo(cx + 8 + whiskerLen, cy + 1 + angle * whiskerLen);
      ctx.stroke();
    }
  }

  /** Draw two front paws. */
  private drawPaws(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    this.drawPawSingle(ctx, dx, dy, true);
    this.drawPawSingle(ctx, dx, dy, false);
  }

  /** Draw a single paw (left or right). */
  private drawPawSingle(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    isLeft: boolean,
  ): void {
    const px = isLeft ? 24 + dx : 40 + dx;
    const py = 66 + dy;

    ctx.beginPath();
    ctx.ellipse(px, py, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAW_COLOR;
    ctx.fill();
    ctx.closePath();

    // Paw outline
    ctx.beginPath();
    ctx.ellipse(px, py, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = BODY_DARK;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.closePath();
  }

  /** Draw a raised paw for nudging state. */
  private drawPawRaised(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    frame: number,
  ): void {
    const wave = Math.sin(frame * 0.15) * 2;
    const px = 24 + dx;
    const py = 58 + dy + wave;

    ctx.beginPath();
    ctx.ellipse(px, py, 5, 3.5, -0.3, 0, 0);
    ctx.ellipse(px, py, 5, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = PAW_COLOR;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.ellipse(px, py, 5, 3.5, -0.3, 0, Math.PI * 2);
    ctx.strokeStyle = BODY_DARK;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.closePath();
  }

  /** Draw subtle tabby stripes on the forehead. */
  private drawStripes(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const cx = 34 + dx;
    const top = 18 + dy;

    ctx.strokeStyle = BODY_DARK;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.4;

    // "M" pattern on forehead (classic tabby marking)
    ctx.beginPath();
    ctx.moveTo(cx - 7, top + 3);
    ctx.lineTo(cx - 3, top);
    ctx.lineTo(cx, top + 3);
    ctx.lineTo(cx + 3, top);
    ctx.lineTo(cx + 7, top + 3);
    ctx.stroke();

    // A couple of thin body stripes
    ctx.beginPath();
    ctx.moveTo(cx - 10, 46 + dy);
    ctx.quadraticCurveTo(cx - 5, 44 + dy, cx - 3, 46 + dy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 5, 46 + dy);
    ctx.quadraticCurveTo(cx + 10, 44 + dy, cx + 12, 46 + dy);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  /** Draw the tail curving out to the side. */
  private drawTail(ctx: CanvasRenderingContext2D, dx: number, dy: number, sway: number): void {
    const startX = 12 + dx;
    const startY = 54 + dy;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX - 12 + sway * 10, startY - 10, startX - 8 + sway * 15, startY - 22);
    ctx.strokeStyle = BODY_COLOR;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Orange tip
    ctx.beginPath();
    ctx.arc(startX - 8 + sway * 15, startY - 22, 3, 0, Math.PI * 2);
    ctx.fillStyle = BODY_DARK;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw the tail pointing straight up (alert state). */
  private drawTailUp(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const startX = 12 + dx;
    const startY = 54 + dy;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX - 4, startY - 18, startX - 2, startY - 32);
    ctx.strokeStyle = BODY_COLOR;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tip curves slightly
    ctx.beginPath();
    ctx.arc(startX - 2, startY - 32, 3, 0, Math.PI * 2);
    ctx.fillStyle = BODY_DARK;
    ctx.fill();
    ctx.closePath();
  }

  /** Draw floating "Z" letters for sleeping state. */
  private drawZzz(ctx: CanvasRenderingContext2D, frame: number): void {
    const phase = (frame * 0.03) % 1;

    ctx.fillStyle = EYE_COLOR;

    const sizes = [8, 10, 12];
    for (let i = 0; i < 3; i++) {
      const zPhase = (phase + i * 0.33) % 1;
      const zx = 50 + i * 4;
      const zy = 20 - zPhase * 20;
      const alpha = 1 - zPhase;

      ctx.globalAlpha = alpha * 0.6;
      ctx.font = `bold ${sizes[i]}px sans-serif`;
      ctx.fillText('z', zx, zy);
    }

    ctx.globalAlpha = 1;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}
