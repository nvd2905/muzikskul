---
description: Draft a message for and commit the current staged changes — optionally push.
argument-hint: [optional message override]
allowed-tools: Bash, AskUserQuestion
---

# commit

Commit the current changes with a clear, convention-following message. This is the missing middle step between `/branch-and-stage` (stages files, drafts a message, never commits) and `/push-and-pr` (pushes and opens a PR, never commits) — `/commit` is what actually runs `git commit`.

## Steps

1. **Preflight.**
   - `git status --short` and `git diff --cached --stat`.
   - If nothing is staged but there are unstaged changes, ask which files to stage — never `git add -A` or `git add .`, always specific paths.
   - If nothing is staged and nothing unstaged, stop and tell the user there's nothing to commit.
   - Scan staged file paths for secret-like patterns (`.env*`, `*credentials*`, `*.pem`, etc.). If any match, stop and confirm with the user before proceeding.

2. **Draft the commit message.**
   - If `$ARGUMENTS` is provided, use it as the summary line — still check it's imperative mood and ≤72 chars.
   - Otherwise inspect `git diff --cached` plus `git log -5 --oneline` (match this repo's existing style) and draft: a concise summary line, and a short body explaining *why* when that's not obvious from the diff alone.
   - Show the drafted message to the user before committing. If a message was already drafted earlier in the conversation (e.g. by `/branch-and-stage`), reuse it instead of re-deriving.

3. **Commit.**
   - Use a heredoc so multi-line messages format correctly:
     ```bash
     git commit -m "$(cat <<'EOF'
     <summary line>

     <body, if any>

     Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
     EOF
     )"
     ```
   - Run `git status` after to confirm the commit succeeded and the tree is clean.

4. **Offer to push.**
   - Ask whether to push now.
   - On a feature branch: `git push -u origin <branch>`.
   - On `main`: confirm explicitly before pushing — it's still shared state even though this repo's deploys are release-triggered, not push-triggered.
   - Never force-push. If the push is rejected (non-fast-forward), stop and surface it — don't pull/rebase without asking.

5. **Report.**
   - Commit hash + summary line.
   - Whether it was pushed, and where.
   - If on a feature branch with no PR yet, remind the user: "Run `/push-and-pr` when ready to open a PR."

## Boundaries

- Never `git add -A` or `git add .` — always specific paths.
- Never amend an existing commit unless the user explicitly asks.
- Never force-push.
- Never skip hooks (`--no-verify`).
- Never commit a file matching a secret-like pattern without explicit confirmation.

## Failure modes

| Symptom | Action |
|---|---|
| Nothing staged or unstaged | Stop. Tell the user there's nothing to commit. |
| Pre-commit hook fails | Fix the underlying issue, re-stage, commit again as a NEW commit — never `--no-verify`. |
| Push rejected (non-fast-forward) | Stop. Ask the user — never force-push or auto-rebase. |
| Staged file looks like a secret | Stop. Confirm with the user before committing. |

## Usage examples

```
/commit
/commit Fix wallet category duplicate check
```
