# Blocked Tasks

Tasks unable to proceed due to dependencies or external blockers.

---

## None currently

No tasks are blocked. All dependencies are satisfied.

---

## Format

When a task becomes blocked, move it here:

```markdown
### TASK-NNN: [Scope] 🚫
- **Blocked by:** TASK-ABC, External dependency X
- **Blocking:** TASK-XYZ (can't start until this unblocks)
- **Reason:** [What's preventing progress]
- **Unblock ETA:** 2026-04-10 (when dependency completes)
- **Notes:** [What to do when unblocked]
```

Example reasons:
- "Waiting for TASK-104 to complete (API not ready)"
- "External: Waiting for API key from vendor"
- "Architectural: Needs decision on auth strategy first"
- "External: Waiting for user feedback on design"

When unblocked:
1. Move task back to BACKLOG.md
2. Note in task: "Unblocked by TASK-ABC on 2026-04-10"
3. Reorder if necessary (move up in priority)

---

## Blocker Categories

| Category | Example | Unblock Trigger |
|----------|---------|-----------------|
| **Dependency** | TASK-110 waiting for TASK-104 | When TASK-104 completes |
| **External API** | Waiting for Pinpoint credentials | Email arrives with keys |
| **Design Decision** | Waiting for auth strategy choice | DECISIONS.md entry + approval |
| **User Feedback** | Waiting for design review | Review comments received |
| **Infrastructure** | Waiting for AWS account setup | Account provisioned |

---

## Tips for Avoiding Blockers

1. **Order tasks by dependency** (BACKLOG.md should be topologically sorted)
2. **Identify blockers early** (design phase, not implementation)
3. **Parallelize when possible** (TASK-102 and TASK-104 independent)
4. **Break long chains** (if A→B→C→D→E, too sequential)

Current backlog has minimal blockers. Good.
