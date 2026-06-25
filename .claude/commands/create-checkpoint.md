---
description: Save the current /build progress to a checkpoint file so work can be resumed in a new session.
argument-hint: [<checkpoint-slug>]
allowed-tools: Read, Write, Glob, Grep, TodoWrite, AskUserQuestion
---

You are creating a checkpoint file that captures exactly where a `/build` task was interrupted. The output must contain enough information for `/continue-checkpoint` to resume without any other context.

## Inputs

`$ARGUMENTS` may be:
- A slug to name the checkpoint (e.g. `12017-solid-refactor`) — write to `.claude/checkpoints/<slug>.md`
- Empty — ask the user for a slug via `AskUserQuestion`

## Process

1. **Resolve the slug.** If `$ARGUMENTS` is empty, ask:
   > What should this checkpoint be called? (e.g. `12017-solid-refactor`)

2. **Identify the active plan file.**
   - Look for the plan referenced in the current conversation, or list `.claude/plans/*.md` and ask the user to confirm which plan is in progress.
   - Read the plan file in full. Extract: goal, task list (with task numbers and descriptions), and any design decisions already captured there.

3. **Read the current todo list** (via `TodoWrite` read or from conversation context) to determine which tasks are `completed`, which is `in_progress`, and which are `pending`.

4. **Inspect completed files on disk.** For every task marked `completed`, list the files it produced. Verify they exist with `Glob`. If a file is missing, mark that task as `PARTIAL` rather than `COMPLETED`.

5. **Capture key design decisions.** From the conversation and plan, extract:
   - Namespace layout
   - Interface signatures (canonical method names and parameter types)
   - Critical ordering rules (e.g. "write tracking record BEFORE blob upload")
   - DI lifetimes for new services
   - Any non-obvious logic preserved from the original code

6. **Write the IMMEDIATE NEXT STEPS section.** For every task that is `in_progress` or `pending`:
   - State exactly what file(s) to create
   - List the constructor dependencies
   - Describe the key methods and their logic in enough detail that no prior context is needed
   - Call out any gotchas or ordering constraints specific to that task

7. **Write the checkpoint file** to `.claude/checkpoints/<slug>.md` using the template below.

8. **Confirm** to the user:
   - Path to checkpoint file written
   - Tasks captured as COMPLETED / PARTIAL / PENDING
   - Remind them to run `/continue-checkpoint <slug>` in the next session

---

## Checkpoint file template

```markdown
# Checkpoint: <title from plan>
**Plan file:** `.claude/plans/<plan-slug>.md`
**Branch:** `<current git branch>`

---

## STATUS

### COMPLETED (files on disk, verified)

| Task | Files Written |
|---|---|
| <N> — <task name> | `path/to/file.cs`, `path/to/other.cs` |

### STILL PENDING

| Task | What remains |
|---|---|
| <N> | `path/to/file.cs` — <one-line description of what it does> |

---

## KEY DESIGN DECISIONS (authoritative)

### Namespaces
<namespace → directory mapping>

### Interface signatures (canonical)
<csharp code blocks for each interface>

### Critical ordering rules
<bullet list of must-preserve orderings>

### DI lifetimes
<Singleton / Scoped / Transient breakdown>

### <Any other non-obvious design decision>

---

## IMMEDIATE NEXT STEPS (in order)

### 1. `<path/to/NextFile.cs>`
Constructor: `<dependencies>`

Key methods:
- `MethodName(params)` — <what it does, step by step>
- <gotchas / ordering constraints>

### 2. `<path/to/AnotherFile.cs>`
<same structure>

### N. Final: Build
```powershell
dotnet build <project-path>
```
Fix any errors before closing.
```

---

## Rules

- Be exhaustive in IMMEDIATE NEXT STEPS — the reader has no session history.
- Never truncate interface signatures or method descriptions with "similar to above" or "see plan".
- If a task is PARTIAL (files written but build not verified), note this explicitly and include the remaining steps.
- Do not commit, push, or modify the plan file.
