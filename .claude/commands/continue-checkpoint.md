---
description: Resume an interrupted /build task from a saved checkpoint file in .claude/checkpoints/.
argument-hint: [<checkpoint-slug>]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, TodoWrite, AskUserQuestion
---

You are resuming an interrupted `/build` task. A checkpoint file captures which tasks were completed and exactly what to implement next.

## Inputs

`$ARGUMENTS` may be:
- A checkpoint slug (e.g. `12017-solid-refactor`) — resolve to `.claude/checkpoints/<slug>.md`
- Empty — list all files in `.claude/checkpoints/` via `AskUserQuestion` and let the user pick

## Process

1. **Resolve the checkpoint file.** If `$ARGUMENTS` is empty, list `.claude/checkpoints/*.md` and ask the user to select one.

2. **Read the checkpoint in full.** Note: the plan file path, which tasks are COMPLETED vs PENDING, all key design decisions, and the IMMEDIATE NEXT STEPS section.

3. **Read the plan file** named in the checkpoint header to get the full task list and original context.

4. **Verify completed files exist on disk** by reading each file listed under COMPLETED in the checkpoint. If any are missing, flag them and offer to re-create before continuing.

5. **Stage todos with `TodoWrite`:**
   - Mark all COMPLETED tasks as `completed`.
   - Set the first PENDING task to `in_progress`.
   - Leave remaining tasks `pending`.

6. **Implement each pending task in order**, following the IMMEDIATE NEXT STEPS in the checkpoint exactly:
   - Read every source file referenced before writing anything — never write blind.
   - Mirror existing patterns (namespaces, naming, DI lifetimes, file layout).
   - Honour all CLAUDE.md conventions: `_camelCase` fields, net10.0 TFM, Orleans 3.7.1 API, no new packages without flagging.
   - Prefer `Edit` over `Write` for existing files.
   - Mark each todo `completed` immediately after its files are written.
   - Run `dotnet build <project>` after each logical chunk; fix compile errors before continuing.

7. **Handle deviations.** If a step can't be implemented as described, stop and surface via `AskUserQuestion` with: *Skip / Adapt as follows / Abort — replan needed*. Never silently improvise.

8. **Do not commit.** No `git add`, no `git commit`, no pushes — `committer` owns that step.

9. **Hand off** with a short summary:
   - Checkpoint file used
   - Files created / modified (path list)
   - Tasks completed / skipped / deviated
   - Build status (clean / errors fixed / errors outstanding)
   - Next step: `/verify` or invoke the `committer` agent

## Critical rules from the checkpoint design decisions
- DI lifetimes: all new services are `Singleton` except `PaygleDbContext` (scoped via `AddDbContext`).
- Preserve exact call ordering from original `Program.cs`: tracking `Status.Processed` write happens **before** blob upload + grain Create on the create path.
- No double-counting: `MigrationStatistics` is the single source of truth for all counters.
- No `UpdateTrackingStatus` calls inside `EmployeeEnricher` — return flags only; caller (`MigrationRunner`) writes tracking.
- `ExtractionCustomBuilder` depends on `IEmployeeEnricher`; `MigrationRunner` calls the builder, not the enricher directly.
