import { ipcRenderer } from 'electron';

const canvas = document.getElementById('bird-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Simple placeholder bird drawing
let frameCount = 0;

function drawBird(x: number, y: number, bobOffset: number): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = x;
  const centerY = y + bobOffset;

  // Body (oval)
  ctx.fillStyle = '#F4A460'; // Sandy brown
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 30, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#FFEFD5'; // Papaya whip
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 8, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#F4A460';
  ctx.beginPath();
  ctx.arc(centerX, centerY - 30, 20, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(centerX - 7, centerY - 33, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + 7, centerY - 33, 3, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 28);
  ctx.lineTo(centerX + 10, centerY - 25);
  ctx.lineTo(centerX, centerY - 22);
  ctx.closePath();
  ctx.fill();

  // Feet
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(centerX - 12, centerY + 32, 8, 4);
  ctx.fillRect(centerX + 4, centerY + 32, 8, 4);
}

function animate(): void {
  frameCount++;
  const bobOffset = Math.sin(frameCount * 0.05) * 3;
  drawBird(canvas.width / 2, canvas.height / 2, bobOffset);
  requestAnimationFrame(animate);
}

// Make the bird area respond to mouse events (not click-through)
canvas.addEventListener('mouseenter', () => {
  ipcRenderer.send('set-ignore-mouse', false);
});

canvas.addEventListener('mouseleave', () => {
  ipcRenderer.send('set-ignore-mouse', true);
});

animate();
