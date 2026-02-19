import { app, BrowserWindow, globalShortcut, ipcMain, powerMonitor, screen } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { ActivityMonitor } from './activity-monitor';
import { setupTray } from './tray';

let mainWindow: BrowserWindow | null = null;
// Keep tray reference to prevent garbage collection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let tray: Electron.Tray | null = null;
const activityMonitor = new ActivityMonitor();
let idlePollTimer: ReturnType<typeof setInterval> | null = null;
let lastIdleTime = 0;

// Persistent storage for window position
const store = new Store<{ windowX: number; windowY: number }>();

function getDefaultPosition(): { x: number; y: number } {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const windowWidth = 200;
  const windowHeight = 200;
  return {
    x: screenWidth - windowWidth - 20,
    y: screenHeight - windowHeight - 20,
  };
}

function createWindow(): void {
  const windowWidth = 200;
  const windowHeight = 200;

  // Restore saved position or use default (primary display, bottom-right)
  const savedX = store.get('windowX');
  const savedY = store.get('windowY');
  const defaultPos = getDefaultPosition();
  const x = savedX ?? defaultPos.x;
  const y = savedY ?? defaultPos.y;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Click-through by default; the renderer will toggle this for the bird sprite area
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Save window position when it moves
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const [wx, wy] = mainWindow.getPosition();
      store.set('windowX', wx);
      store.set('windowY', wy);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toggleWindow(): void {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    // Fade out
    mainWindow.webContents.send('opacity-transition', 'hide');
    setTimeout(() => {
      if (mainWindow) mainWindow.hide();
    }, 300);
  } else {
    mainWindow.show();
    mainWindow.webContents.send('opacity-transition', 'show');
  }
}

// Handle mouse event forwarding for click-through behavior
ipcMain.on('set-ignore-mouse', (_event, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

app.whenReady().then(() => {
  createWindow();

  // Set up system tray
  if (mainWindow) {
    tray = setupTray(mainWindow);
  }

  // Register show/hide hotkey: Cmd+Shift+P
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    toggleWindow();
  });

  // Set up activity monitor to send state updates to the renderer
  activityMonitor.onStateUpdate((update) => {
    if (mainWindow) {
      mainWindow.webContents.send('activity-update', update);
    }
  });
  activityMonitor.start();

  // Poll system idle time to infer keyboard/mouse activity.
  // When idle time drops (user became active), record aggregate keystroke events.
  // This is a privacy-safe approach — we never see actual key content.
  idlePollTimer = setInterval(() => {
    const currentIdleTime = powerMonitor.getSystemIdleTime();
    if (currentIdleTime < lastIdleTime) {
      const activeSeconds = Math.min(lastIdleTime, 2);
      for (let i = 0; i < activeSeconds; i++) {
        activityMonitor.recordKeystroke();
      }
    }
    lastIdleTime = currentIdleTime;
  }, 1000);
});

app.on('window-all-closed', () => {
  activityMonitor.stop();
  globalShortcut.unregisterAll();
  if (idlePollTimer) {
    clearInterval(idlePollTimer);
  }
  app.quit();
});
