# Superpowers Integration

This project integrates with the Superpowers workflow for structured AI-assisted development.

## Workflow

```
brainstorming → harness-init → writing-plans → executing-plans → finishing
```

## Superpowers Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Start design session |
| `/HARNESS` | Generate harness project |
| `/plan` | Create implementation plan |
| `/implement` | Execute plan tasks |
| `/finish` | Complete development |

## Design Document Location

Approved designs are saved to: `docs/superpowers/specs/`

## Implementation Plan Location

Implementation plans are saved to: `docs/superpowers/plans/`

## Git Worktree

This project uses git worktrees for isolated development:

- Main branch: `main`
- Development branches: `dev/*`

## Verification

Run verification before completing:

```bash
bun test
bun run lint
bun run health
```
