import * as path from 'path';
import { BirdState } from '../../shared/types';

const SPRITE_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'sprites');

/** Background type for each sprite image — used for transparency processing. */
const SPRITE_CONFIG: Record<BirdState, { file: string; bgType: 'black' | 'white' }> = {
  idle: { file: 'idle.webp', bgType: 'white' },
  sleeping: { file: 'sleeping.webp', bgType: 'black' },
  nudging: { file: 'nudging.webp', bgType: 'black' },
  happy: { file: 'happy.webp', bgType: 'black' },
  sad: { file: 'sad.webp', bgType: 'black' },
};

/**
 * BirdSprite loads pre-made pixel-art cat images for each state and renders
 * them onto the canvas. Background colors are removed to achieve transparency.
 */
export class BirdSprite {
  private readonly width = 180;
  private readonly height = 180;
  private sprites: Map<BirdState, HTMLCanvasElement> = new Map();

  constructor() {
    this.loadSprites();
  }

  private loadSprites(): void {
    const states = Object.keys(SPRITE_CONFIG) as BirdState[];

    for (const state of states) {
      const config = SPRITE_CONFIG[state];
      const img = new Image();
      img.onload = () => {
        const canvas = this.processImage(img, config.bgType);
        this.sprites.set(state, canvas);
      };
      img.src = `file://${path.join(SPRITE_DIR, config.file)}`;
    }
  }

  /**
   * Draw the loaded image onto an offscreen canvas and replace the background
   * color (black or white) with transparency.
   */
  private processImage(img: HTMLImageElement, bgType: 'black' | 'white'): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = r + g + b;

      if (bgType === 'black') {
        if (brightness < 60) {
          data[i + 3] = 0;
        } else if (brightness < 120) {
          data[i + 3] = Math.round(((brightness - 60) / 60) * 255);
        }
      } else {
        if (brightness > 700) {
          data[i + 3] = 0;
        } else if (brightness > 600) {
          data[i + 3] = Math.round(((700 - brightness) / 100) * 255);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: BirdState,
    _frame: number,
  ): void {
    const sprite = this.sprites.get(state);
    if (!sprite) return;

    // Preserve aspect ratio while fitting within the target area
    const scale = Math.min(this.width / sprite.width, this.height / sprite.height);
    const drawW = sprite.width * scale;
    const drawH = sprite.height * scale;
    const offsetX = (this.width - drawW) / 2;
    const offsetY = (this.height - drawH) / 2;

    ctx.drawImage(sprite, x + offsetX, y + offsetY, drawW, drawH);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}
