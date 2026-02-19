# Perch — Desktop Digital Pet

## Project Overview
Perch is a lightweight desktop companion app (Electron + TypeScript) that sits in the
system tray / along the taskbar edge. It displays an animated bird character that 
reacts to the user's work patterns and provides gentle wellness reminders.

## Tech Stack
- **Framework**: Electron (with electron-builder for packaging)
- **Language**: TypeScript (strict mode)
- **Rendering**: HTML5 Canvas or PixiJS for sprite animation
- **State Management**: Simple event-driven architecture (no Redux needed for MVP)
- **Activity Monitoring**: electron `powerMonitor` + `globalShortcut` listener for 
  typing frequency (aggregate only — NO keylogging of actual content)
- **AI Behavior Engine**: Simple rule-based state machine for MVP 
  (busy/idle/break states), with hooks for future ML integration
- **Build**: electron-builder, targeting macOS (.dmg)

## Architecture Rules
- All typing monitoring must be AGGREGATE ONLY (keystrokes/min count, never content)
- The app must be non-intrusive: always-on-top transparent window, click-through 
  except for the bird sprite itself
- Bird states: idle, sleeping, alert, nudging, happy, sad
- Reminder logic: only nudge during detected idle/break transitions, never during 
  active typing bursts
- Keep the main process lean; do heavy logic in renderer or worker

## File Structure
perch/
├── CLAUDE.md
├── PRD.md
├── PROGRESS.md
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts
│   │   ├── tray.ts
│   │   └── activity-monitor.ts
│   ├── renderer/       # Electron renderer (the bird window)
│   │   ├── index.html
│   │   ├── renderer.ts
│   │   ├── bird/
│   │   │   ├── sprites.ts
│   │   │   ├── state-machine.ts
│   │   │   └── animations.ts
│   │   └── ui/
│   │       └── overlay.ts
│   └── shared/
│       ├── types.ts
│       └── constants.ts
├── assets/
│   └── sprites/        # Bird sprite sheets (can be placeholder initially)
└── docs/
## Development Rules
- Always run `npm run lint` after making changes
- Always run `npm test` after implementing a feature
- Commit after EACH completed PRD task with a descriptive message
- Update PROGRESS.md after each completed task
- If a task is blocked, document WHY in PROGRESS.md and move on
- Use git worktrees for experimental features if needed
- Spawn subagents (Task tool) for independent modules like sprite animation 
  vs. activity monitoring

## What NOT To Do
- Do NOT keylog actual content — only aggregate keystroke counts
- Do NOT use `sudo` or install global system packages
- Do NOT modify files outside the ~/perch directory
- Do NOT make network requests (this is an offline-first app for MVP)
- Do NOT delete the PRD.md or PROGRESS.md files