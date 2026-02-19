# In ~/perch, create ralph.sh
cat << 'SCRIPT' > ~/perch/ralph.sh
#!/bin/bash
set -e
cd ~/perch
MAX_ITERATIONS=50
COMPLETION_PROMISE="MVP_COMPLETE"

PROMPT='You are building Perch, a desktop digital pet app.

READ these files at the start of EVERY iteration:
1. CLAUDE.md — project rules and architecture
2. PRD.md — the full task list
3. PROGRESS.md — what is already done

YOUR WORKFLOW EACH ITERATION:
1. Read the three files above
2. Find the FIRST unchecked task in PRD.md
3. Implement it completely (write code, run tests, fix errors)
4. Run `npm run lint` if applicable
5. Run `npm test` if tests exist
6. Git commit: "Task X.Y: <description>"
7. Update PROGRESS.md to mark the task done
8. If stuck on a task for this entire iteration, document the blocker in PROGRESS.md and skip to the next task

USE SUBAGENTS (Task tool) when tasks are independent:
- Spawn a subagent for sprite/animation work while you handle main process setup
- Spawn a subagent for writing tests while you implement features
- Always verify subagent output before committing

IMPORTANT CONSTRAINTS:
- ONLY work on tasks from PRD.md — do not invent new features
- ONLY work on ONE task per iteration
- Always commit after completing a task
- Never use sudo, curl, wget, or install global packages
- Activity monitoring must be AGGREGATE keystroke counts only — never log content

When ALL tasks in the PRD are complete and all tests pass, output the exact string: MVP_COMPLETE'

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "========================================"
  echo "  RALPH ITERATION $i / $MAX_ITERATIONS"
  echo "========================================"
  echo ""
  
  OUTPUT=$(claude -p "$PROMPT" --allowedTools "Read,Write,Edit,MultiEdit,Glob,Grep,LS,Task,Bash(git *),Bash(npm *),Bash(npx *),Bash(node *),Bash(tsc *),Bash(eslint *),Bash(prettier *),Bash(cat *),Bash(ls *),Bash(mkdir *),Bash(cp *),Bash(mv *),Bash(echo *),Bash(pwd),Bash(which *),Bash(head *),Bash(tail *),Bash(wc *),Bash(find *),Bash(grep *),Bash(sed *),Bash(chmod *),Bash(touch *),Bash(electron *),Bash(electron-builder *)" 2>&1)
  
  echo "$OUTPUT"
  
  # Check for completion
  if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
    echo ""
    echo "========================================"
    echo "  RALPH COMPLETE after $i iterations!"
    echo "========================================"
    exit 0
  fi
done

echo ""
echo "========================================"
echo "  RALPH HIT MAX ITERATIONS ($MAX_ITERATIONS)"
echo "========================================"
exit 1
SCRIPT

chmod +x ~/perch/ralph.sh