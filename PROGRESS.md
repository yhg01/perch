# Perch Build Progress

## Status: PHASE 3 COMPLETE

## Completed Tasks
- [x] 1.1 Initialize package.json with Electron, TypeScript, electron-builder deps
- [x] 1.2 Set up tsconfig.json with strict mode
- [x] 1.3 Set up electron-builder.yml targeting macOS
- [x] 1.4 Create basic Electron main process (main.ts)
- [x] 1.5 Create basic renderer with HTML5 canvas
- [x] 1.6 Verify the app launches with `npm start`
- [x] 1.7 Add npm scripts: start, build, lint, test
- [x] 1.8 Set up ESLint + Prettier config
- [x] 1.9 Git commit: Phase 1 complete
- [x] 2.1 Create placeholder bird sprite
- [x] 2.2 Implement sprite state machine
- [x] 2.3 Create frame-based animation loop
- [x] 2.4 Implement idle animation
- [x] 2.5 Implement transition animations
- [x] 2.6 Make bird sprite clickable
- [x] 2.7 On click: happy animation then return
- [x] 2.8 Write unit tests for state machine (28 tests)
- [x] 2.9 Git commit: Phase 2 complete
- [x] 3.1 Implement aggregate keystroke counter (powerMonitor polling, never content)
- [x] 3.2 Create sliding window tracker (30s window)
- [x] 3.3 Implement work state inference (active_typing/light_activity/idle)
- [x] 3.4 Track continuous work duration (5min idle resets)
- [x] 3.5 Send activity state updates via IPC
- [x] 3.6 Write unit tests for activity classification (37 tests)
- [x] 3.7 Git commit: Phase 3 complete

## Blocked Tasks
(none)

## Notes
- Activity monitoring uses powerMonitor.getSystemIdleTime() polling (privacy-safe)
- Injectable time source in ActivityMonitor for testability
- 65 total tests passing across state machine + activity monitor
