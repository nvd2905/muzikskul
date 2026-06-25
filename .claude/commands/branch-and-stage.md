# branch-and-stage

Create a fix branch, stage the relevant changes, and draft a commit message — without committing or pushing.

## Steps

1. **Determine the branch name.**
   - If the user passed a ticket ID (e.g. `13934`) derive the branch name as `<id>-<short-slug>` where the slug is a kebab-case summary of the change (≤5 words).
   - If the user passed a free-text description, convert it to a `<kebab-slug>`.
   - Confirm the branch name with the user before creating it.

2. **Create the branch.**
   ```
   git checkout -b <branch-name>
   ```

3. **Identify files to stage.**
   - Run `git status` and `git diff` to understand what changed.
   - Stage only files that are part of the fix — exclude untracked config/tooling files (`.mcp.json`, `.vscode/`, `CLAUDE.md`, `.claude/`, etc.) unless the user explicitly asks to include them.
   - Stage with specific file paths, never `git add -A` or `git add .`.

4. **Draft the commit message.**
   - Format: `#<ticket-id> - <imperative-mood summary, ≤72 chars>` — header line only, no body.
   - Present the draft to the user for review. Do NOT run `git commit`.

5. **Report.**
   - Show the branch name, staged files, and the drafted commit message.
   - Remind the user: "Run `/commit` (or use the committer agent) when ready to commit and push."

## Usage examples

```
/branch-and-stage 13934
/branch-and-stage fix stale external dispatch date for pending status
```
