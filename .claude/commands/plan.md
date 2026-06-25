---
description: Invoke the planner agent for free-text planning. Pass a task description.
---

# /plan — planning

Delegates immediately to the **`planner`** agent:

```
Agent(subagent_type: "planner", prompt: "<user's input verbatim>")
```

Pass a free-text task description. The planner will:
1. Walk the codebase to find affected files.
2. Ask clarifying questions if needed (one batched round).
3. Produce a numbered file-by-file plan.
4. Save it to `.claude/plans/<slug>.md`.

After the plan is confirmed, invoke `/build`.
