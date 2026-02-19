# Perch Build Progress

## Status: PHASE 1 COMPLETE

## Completed Tasks
- [x] 1.1 Initialize package.json with Electron, TypeScript, electron-builder deps
- [x] 1.2 Set up tsconfig.json with strict mode
- [x] 1.3 Set up electron-builder.yml targeting macOS
- [x] 1.4 Create basic Electron main process (main.ts) — transparent, frameless, always-on-top window at bottom-right
- [x] 1.5 Create basic renderer with HTML5 canvas — placeholder bird drawing with bobbing animation
- [x] 1.6 Verify the app launches with `npm start` — compilation verified, output files in correct locations
- [x] 1.7 Add npm scripts: start, build, lint, test
- [x] 1.8 Set up ESLint + Prettier config
- [x] 1.9 Git commit: "Phase 1 complete — project foundation"

## Blocked Tasks
(none)

## Notes
- Renderer uses nodeIntegration for IPC (click-through mouse event handling)
- HTML is copied from src to dist during compile step
- Jest configured with --passWithNoTests until tests are added in Phase 2
