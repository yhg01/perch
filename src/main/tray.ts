import { Tray, Menu, nativeImage, BrowserWindow, app, dialog } from 'electron';

/**
 * Creates a simple 16x16 tray icon — a small green circle on a transparent background.
 * Uses a raw RGBA buffer to avoid needing an external image file.
 */
function createTrayIcon(): Electron.NativeImage {
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4, 0); // RGBA, fully transparent

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX + 0.5;
      const dy = y - centerY + 0.5;
      if (dx * dx + dy * dy <= radius * radius) {
        const offset = (y * size + x) * 4;
        buffer[offset] = 0x4c; // R
        buffer[offset + 1] = 0xaf; // G
        buffer[offset + 2] = 0x50; // B
        buffer[offset + 3] = 0xff; // A
      }
    }
  }

  const image = nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size,
  });
  image.setTemplateImage(true);

  return image;
}

/**
 * Sets up the system tray icon and context menu for the Perch app.
 * Returns the Tray instance so the caller can keep a reference (preventing GC).
 */
export function setupTray(mainWindow: BrowserWindow): Tray {
  const icon = createTrayIcon();
  const tray = new Tray(icon);

  tray.setToolTip('Perch');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Perch',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'About',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: 'About Perch',
          message: `Perch v${app.getVersion()}`,
          detail: 'A lightweight desktop companion bird that reacts to your work patterns.',
          buttons: ['OK'],
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // On macOS, clicking the tray icon toggles window visibility
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  return tray;
}
