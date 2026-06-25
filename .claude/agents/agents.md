# Agents

## Agent Roster

| Agent | File | Model | Boundary |
|---|---|---|---|
| `planner` | `.claude/agents/planner.md` | `opus` | Read-only — walks the codebase and produces a file-by-file plan; saves to `.claude/plans/`. No code changes. |
| `code-reviewer` | `.claude/agents/code-reviewer.md` | `sonnet` | Read-only — reviews against muzikskul conventions; reports findings, no code changes. |
| `supabase-specialist` | `.claude/agents/data-layer-specialist.md` | `sonnet` | Writes data-layer changes (Supabase queries, services.ts, SQL migrations, RLS policies). |
| `security-auditor` | `.claude/agents/security-auditor.md` | `sonnet` | Read-only — OWASP-mapped severity findings, no code changes. |
| `committer` | `.claude/agents/committer.md` | `sonnet` | Commits and optionally pushes. Never force-pushes, never opens PRs, never stages files. |

## Standard Development Workflow

```
1. Plan    → /plan slash command
2. Build   → /build slash command
3. Verify  → /verify slash command
4. Commit  → /commit slash command
```

## Parallel Execution

Run agents in parallel when their dimensions are independent. Launch them in a single response with multiple `Agent` tool calls (`run_in_background: true`).

```
Single response — launch in parallel:
  → code-reviewer          (correctness, conventions, server/client boundary)
  → security-auditor       (auth, RLS, secrets — only if security-relevant paths changed)
  → supabase-specialist    (query/schema review — only if services.ts or migrations changed)
```

## When to use which

| Trigger | Agent |
|---|---|
| Any planning task | `/plan` (planner) |
| Any non-trivial change before commit | `code-reviewer` |
| New table / migration / RLS policy / services.ts change | `supabase-specialist` |
| New protected route / auth change / middleware edit | `security-auditor` |
| New Server Action or Supabase query | `security-auditor` |
| End of workflow (post-/verify) | `committer` |

## Boundaries

- No architecture refactors on their own initiative.
- No package upgrades.
- No commits / no pushes — **except `committer`, which is the only agent allowed to invoke `git commit` or `git push`. Even `committer` never force-pushes and never opens PRs.**
