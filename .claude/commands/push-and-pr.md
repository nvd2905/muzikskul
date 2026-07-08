---
description: Push the current branch and open a GitHub PR against main.
argument-hint: [optional PR title override]
allowed-tools: Bash, AskUserQuestion
---

# push-and-pr

Push the current branch to `origin` and open a pull request targeting `main` — without merging.

## Steps

1. **Preflight.**
   - `git status` — confirm there are commits on the current branch that aren't on `main` (`git log main..HEAD --oneline`). If there's nothing to push, stop and tell the user.
   - Refuse to run this directly on `main` — a PR needs a feature branch. If on `main`, stop and ask the user to branch first (e.g. via `/branch-and-stage`).
   - Check for uncommitted changes (`git status --porcelain`). If there are any, stop and ask whether to commit first — never commit on the user's behalf here.

2. **Push.**
   - `git push -u origin <current-branch>` (use `-u` whether or not upstream exists — safe no-op if already set).
   - If the push is rejected (non-fast-forward), stop and surface the rejection. Never force-push unless the user explicitly says so in their reply, naming the branch.

3. **Draft the PR.**
   - `git log main..HEAD --oneline` and `git diff main...HEAD` to understand everything the PR will include (not just the latest commit).
   - Title: short (<70 chars), imperative mood. Use `$ARGUMENTS` as the title if provided, otherwise derive one from the commits.
   - Body: a short "## Summary" (1-3 bullets on what changed and why) and a "## Test plan" checklist (what was verified / what the reviewer should check). Keep it grounded in the actual diff — don't invent testing that wasn't done.
   - Show the drafted title + body to the user before creating the PR.

4. **Create the PR.**
   - `gh pr create --title "<title>" --body "<body>" --base main`
   - Use a heredoc for the body to preserve formatting.

5. **Report.**
   - Return the PR URL.

## Boundaries

- Never merge the PR.
- Never force-push.
- Never open a PR from `main`.
- Never commit on the user's behalf — if there are uncommitted changes, ask first.

## Failure modes

| Symptom | Action |
|---|---|
| On `main` with no feature branch | Stop. Point to `/branch-and-stage`. |
| Uncommitted changes present | Stop. Ask whether to commit first. |
| Nothing to push (branch == main history) | Stop. Tell the user there's nothing to PR. |
| Push rejected (non-fast-forward) | Stop. Ask the user. No force-push. |
| `gh` not authenticated | Surface the exact `gh` error; don't retry blindly. |
