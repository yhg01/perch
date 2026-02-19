import { app, BrowserWindow, ipcMain, powerMonitor, screen } from 'electron';
import * as path from 'path';
import { ActivityMonitor } from './activity-monitor';

let mainWindow: BrowserWindow | null = null;
const activityMonitor = new ActivityMonitor();
let idlePollTimer: ReturnType<typeof setInterval> | null = null;
let lastIdleTime = 0;

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 200;
  const windowHeight = 200;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth - 20,
    y: screenHeight - windowHeight - 20,
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

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle mouse event forwarding for click-through behavior
ipcMain.on('set-ignore-mouse', (_event, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

app.whenReady().then(() => {
  createWindow();

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
    // If idle time decreased, the user just did something (typing/mouse)
    if (currentIdleTime < lastIdleTime) {
      // Estimate activity: record a keystroke for each second of detected activity
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
  if (idlePollTimer) {
    clearInterval(idlePollTimer);
  }
  app.quit();
});
