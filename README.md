# Perch

A lightweight desktop companion cat that sits on your screen and reacts to your work patterns. Perch provides gentle wellness reminders — stretch breaks after long typing sessions and periodic hydration nudges — all without ever logging what you type.

## Features

- **Animated cat companion** — a canvas-drawn orange & white cat with six states (idle, sleeping, alert, nudging, happy, sad) and smooth transition animations
- **Activity-aware** — monitors aggregate keystroke frequency (never content) to detect active typing, light activity, and idle periods
- **Stretch reminders** — nudges you after 45 minutes of continuous typing
- **Hydration reminders** — gentle "Stay hydrated!" every 60 minutes
- **Time-of-day awareness** — cat gets sleepy after 10 PM and perks up in the morning
- **Dismissal cooldown** — dismissed reminders won't return for 15 minutes
- **System tray** — context menu with Show/Hide, About, and Quit
- **Keyboard shortcut** — Cmd+Shift+P to toggle visibility
- **Click-through window** — transparent overlay that doesn't interfere with your work; click the cat to interact

## Requirements

- macOS 10.15 or later (arm64 / Apple Silicon build included)
- Node.js 18+ (for development)

## Installation

### From DMG

1. Open `out/Perch-1.0.0-arm64.dmg`
2. Drag **Perch** to your Applications folder
3. Launch Perch — the cat appears at the bottom-right of your primary display

### From Source

```bash
git clone <repo-url> && cd perch
npm install
npm start
```

## Development

```bash
# Run the app in development mode
npm start

# Run tests (96 tests across 3 suites)
npm test

# Lint
npm run lint

# Build macOS DMG
npm run build
```

## Architecture

| Layer | Path | Purpose |
|-------|------|---------|
| Main process | `src/main/` | Electron window, tray, activity monitor, IPC |
| Renderer | `src/renderer/` | Canvas cat, behavior engine, UI overlay |
| Shared | `src/shared/` | Types and constants used by both processes |

### Privacy

Perch only counts keystrokes per 30-second window — it **never** records, stores, or transmits the content of what you type. All monitoring is local and aggregate-only.

## License

MIT
