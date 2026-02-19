# Perch MVP — Product Requirements Document

## Instructions for Claude
Work through each task sequentially. After completing a task:
1. Run any relevant tests
2. Git commit with message: "✅ Task X.Y: <description>"
3. Mark the task complete in PROGRESS.md
4. Move to the next unchecked task

If blocked on a task for more than 2 iterations, document what's blocking 
you in PROGRESS.md and skip to the next task.

When ALL tasks are complete, output: <promise>MVP_COMPLETE</promise>

---

## Phase 1: Project Foundation
- [ ] 1.1 Initialize package.json with Electron, TypeScript, electron-builder deps
- [ ] 1.2 Set up tsconfig.json with strict mode
- [ ] 1.3 Set up electron-builder.yml targeting macOS
- [ ] 1.4 Create basic Electron main process (main.ts) that opens a transparent, 
      frameless, always-on-top window positioned at bottom-right of screen
- [ ] 1.5 Create basic renderer with HTML5 canvas
- [ ] 1.6 Verify the app launches with `npm start` — transparent window visible
- [ ] 1.7 Add npm scripts: start, build, lint, test
- [ ] 1.8 Set up ESLint + Prettier config
- [ ] 1.9 Git commit: "Phase 1 complete — project foundation"

## Phase 2: Bird Sprite System
- [ ] 2.1 Create a simple placeholder bird sprite (colored rectangles/circles 
      as stand-in art — no external assets needed)
- [ ] 2.2 Implement sprite state machine with states: idle, sleeping, alert, 
      nudging, happy
- [ ] 2.3 Create frame-based animation loop on canvas (requestAnimationFrame)
- [ ] 2.4 Implement idle animation (gentle bobbing/breathing)
- [ ] 2.5 Implement transition animations between states
- [ ] 2.6 Make the bird sprite clickable (detect click on canvas)
- [ ] 2.7 On click: bird plays "happy" animation, then returns to current state
- [ ] 2.8 Write unit tests for state machine transitions
- [ ] 2.9 Git commit: "Phase 2 complete — bird sprite system"

## Phase 3: Activity Monitoring
- [ ] 3.1 Implement aggregate keystroke counter in main process 
      (count only, NOT content — use globalShortcut or IOHook equivalent)
- [ ] 3.2 Create sliding window tracker: keystrokes per 30-second window
- [ ] 3.3 Implement work state inference: 
      - "active_typing" (>30 keys/30s), 
      - "light_activity" (5-30 keys/30s), 
      - "idle" (<5 keys/30s for 2+ min)
- [ ] 3.4 Track continuous work duration (time since last >5min idle)
- [ ] 3.5 Send activity state updates from main to renderer via IPC
- [ ] 3.6 Write unit tests for activity classification logic
- [ ] 3.7 Git commit: "Phase 3 complete — activity monitoring"

## Phase 4: Behavior Engine (AI Logic)
- [ ] 4.1 Create rule-based behavior engine that maps activity states to bird states:
      - active_typing → bird sleeps/rests quietly
      - light_activity → bird is idle, occasionally looks around
      - idle → bird becomes alert, may nudge
- [ ] 4.2 Implement reminder system: after 45min continuous active_typing, 
      bird enters "nudging" state with a small tooltip: "Stretch a little?"
- [ ] 4.3 Implement hydration reminder: every 60 min, gentle water drop icon
- [ ] 4.4 Respect dismissal: if user clicks dismiss, don't re-nudge for 15 min
- [ ] 4.5 Time-of-day awareness: bird gets sleepy after 10pm, 
      perky in morning
- [ ] 4.6 Write integration tests for behavior engine + activity monitor
- [ ] 4.7 Git commit: "Phase 4 complete — behavior engine"

## Phase 5: System Tray & Polish
- [ ] 5.1 Add system tray icon with context menu (Quit, Show/Hide Perch, About)
- [ ] 5.2 Implement show/hide toggle (Cmd+Shift+P hotkey)
- [ ] 5.3 Remember window position across restarts (electron-store)
- [ ] 5.4 Add smooth opacity transitions when bird appears/disappears
- [ ] 5.5 Ensure window is click-through except on the bird sprite itself
- [ ] 5.6 Handle multi-monitor: position on primary display
- [ ] 5.7 Git commit: "Phase 5 complete — system tray & polish"

## Phase 6: Build & Package
- [ ] 6.1 Configure electron-builder for macOS DMG output
- [ ] 6.2 Add app icon (simple placeholder)
- [ ] 6.3 Build the app: `npm run build`
- [ ] 6.4 Verify the built .app launches correctly
- [ ] 6.5 Run full test suite one final time
- [ ] 6.6 Write README.md with installation and usage instructions
- [ ] 6.7 Final git commit: "Phase 6 complete — MVP ready"
- [ ] 6.8 Output: <promise>MVP_COMPLETE</promise>