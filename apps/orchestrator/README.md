# FlowVision Orchestrator (AI Agents)

Local orchestrator that routes GitHub issues/PRs to AI discipline agents (Backend, Frontend, UX, QA, AI, DevOps) and enforces our delivery standards.

## Goals

- Auto-triage issues by labels/milestones and assign agent runners
- Enforce process: one-issue-per-PR, conventional commits, PR template checks
- Review PRs for gates (tests, axe, analytics, docs) before auto-merge

## Quick start (dev)

1. Create a GitHub App (private) with Issues/PR/Projects read-write and Webhooks enabled.
2. Copy `.env.example` to `.env` and fill app credentials and model keys.
3. Install deps and run the server:

```bash
cd apps/orchestrator
npm install
npm run dev
```

4. Use `smee.io` or `ngrok` for webhook forwarding during local dev.

## Events handled

- issue.opened/labeled: route to agent, add project card, post checklist
- pull_request events: enforce PR template, run lightweight checks, post review

## Notes

- This service is optional and dev-only; it never touches production secrets.
