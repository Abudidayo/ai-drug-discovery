---
name: software-engineering-principles
description: "Use for any software engineering work: editing code, building features, debugging, refactoring, creating backend/frontend systems, writing tests, migrations, adapters, APIs, workflows, configuration, or documentation for codebases. Enforces root-cause implementation, maintainability, reliability, security, predictable code, current docs, and production-minded validation."
---

# Software Engineering Principles

Good software is not clever code. It is code that survives change, scale, bugs, teammates, pressure, and time.

Use this skill for all codebase work. Optimize for maintainability, predictability, extensibility, debuggability, operational reliability, and safe delivery.

## Working rules

- Inspect relevant files before editing.
- Follow existing project workflow patterns: specs, plans, tests, architecture docs, conventions, and package manager.
- Fix root causes, not symptoms or patch-only workarounds.
- Keep changes minimal, focused, production-ready, and scalable.
- Do not leave TODO/FIXME/temp comments, fake integrations, mock production logic, scaffold-only implementations, or partial work unless explicitly requested.
- Use current official documentation for unfamiliar libraries, third-party integrations, unclear APIs, or current behavior.
- Be willing to disagree constructively when the requested approach is risky or inferior.
- Stop and ask before risky, irreversible, ambiguous, credential-dependent, deployment-related, or scope-changing actions.
- Do not use git commands that modify repository state (`git add`, `git commit`, `git push`, etc.) unless explicitly directed. `git status` and `git diff` are okay.
- Keep secrets out of code and logs. Use environment/config boundaries.

## Core principles

1. **Single responsibility** — Each module, function, component, service, adapter, repository, workflow, or endpoint should have one clear job.
2. **Separation of concerns** — Do not mix UI, business logic, persistence, external APIs, request handling, workflow orchestration, and configuration.
3. **Predictable code over clever code** — Prefer readable, boring, explicit flows that future engineers can understand quickly.
4. **Explicitness over magic** — Avoid hidden factories, implicit side effects, unclear auto-registration, and hard-to-trace control flow.
5. **Modularity** — Design systems so providers, storage, models, billing, APIs, and workflows can be replaced without rewriting everything.
6. **Low coupling, high cohesion** — Keep related code together and avoid modules that know too much about unrelated systems.
7. **Strong naming** — Use names that communicate domain meaning. Avoid vague names like `data`, `tmp`, `handler2`, `processFinal`, or `thing`.
8. **Consistency** — Follow existing conventions for files, folders, API shapes, errors, schemas, logging, tests, and adapters.
9. **Error handling is part of the system** — Handle expected failures explicitly. Classify retryable/non-retryable failures. Return safe errors.
10. **Observability matters** — Critical actions should emit useful logs, metrics, traces, or audit records without leaking sensitive data.
11. **Avoid unnecessary duplication, but do not over-abstract too early** — Centralize proven repeated patterns; prefer small duplication over wrong abstractions.
12. **Optimize for change** — Assume requirements, providers, APIs, models, pricing, and user needs will change.
13. **Write for teams** — Code should be understandable, debuggable, extensible, and deployable by someone else.
14. **Testing discipline** — Test core business logic, auth, permissions, billing, workflows, integrations, adapters, failure modes, and regressions.
15. **Controlled side effects** — Imports/module initialization should not secretly write databases, send emails, trigger jobs, call APIs, or mutate global state.
16. **Use types properly** — Avoid `any` or suppressions unless justified and approved. Treat types and schemas as system contracts.
17. **Minimize blast radius** — Use idempotency, retries, queues, locks, circuit breakers, rate limits, isolation, and dead-letter handling where appropriate.
18. **Documentation explains why** — Prefer concise docs that explain decisions, tradeoffs, setup, constraints, and operational behavior.
19. **Simplicity wins** — Avoid unnecessary microservices, plugin systems, factories, orchestration layers, and framework-like abstractions.
20. **Security and reliability are defaults** — Validate input, enforce tenant/workspace isolation, least privilege, safe logging, rate limits, and recoverable failure paths.

## Code and documentation style

- Prefer self-documenting code with clear structure and names.
- Comments should explain why a decision exists, not restate obvious code.
- Documentation should be concise, scannable, and useful.
- Use examples when they clarify real usage.
- Avoid root-level clutter and duplicated patterns.

## Validation standard

Before claiming completion:

- Run the most relevant checks available: typecheck, tests, lint, build, verifier scripts, migrations checks, or targeted reproductions.
- Add or update focused tests where practical.
- Verify that checks actually cover the requested outcome.
- Explain any checks that could not run, why, and what the user must do later.
- Audit the final state against the objective and source-of-truth docs, not just against changed files.
