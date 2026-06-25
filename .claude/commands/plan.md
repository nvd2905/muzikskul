---
description: Invoke the planner agent for ticket-driven or free-text planning. Pass an Azure DevOps work item ID (e.g. 13877) or a free-text task description.
---

# /plan — planning

Delegates immediately to the **`planner`** agent:

```
Agent(subagent_type: "planner", prompt: "<user's input verbatim>")
```

- **Work item ID** — fetches the work item from Azure DevOps and produces a file-by-file plan scoped to Paygle.Core conventions (net10.0 / netstandard2.0, EF Core + PostgreSQL, Orleans 3.7.1, Elsa workflows, CQRS layers).
- **Free-text** — skips the ADO fetch and plans from the description alone.

After the plan is confirmed, the user invokes `/build`.
