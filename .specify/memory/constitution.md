<!--
Sync Impact Report
- Version change: unversioned template -> 1.0.0
- Modified principles: placeholders -> Contract First; Strict Validation at the Edge; Typed, Lint-Clean, Test-Gated Changes; Preserve Module Boundaries; Keep Persistence Explicit
- Added sections: Repository Constraints; Development Workflow
- Removed sections: template placeholders and example comments
- Templates reviewed: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->

# Book Library Constitution

## Core Principles

### I. Contract First
The OpenAPI contract is the source of truth. Any route, DTO, or schema change MUST update
[openapi.yaml](../../openapi.yaml) and the implementation in the same change.

### II. Strict Validation at the Edge
All external input MUST pass through the global `ValidationPipe` and `class-validator`
decorators. Unknown fields are rejected, and validation rules live with the DTOs.

### III. Typed, Lint-Clean, Test-Gated Changes
New code MUST remain TypeScript-safe, pass lint, and keep the relevant unit and e2e tests
green. `no-explicit-any` and floating promises are defects, not shortcuts.

### IV. Preserve Module Boundaries
Feature logic belongs in the owning NestJS module, shared behavior in `common/`, and
duplication is resolved only after it is proven. Backend and frontend responsibilities stay
separate but contract-aligned.

### V. Keep Persistence Explicit
The in-memory TypeORM + SQLite setup is disposable, so entity mapping changes MUST be
deliberate and paired with contract and test updates. The Book↔Author many-to-many
relationship is a critical invariant.

## Repository Constraints

- Backend routes are exposed under `/api` on port `8080`; the Angular frontend consumes the
	API through a local proxy.
- Generated artifacts, `dist/`, and `coverage/` remain out of source control and out of
	manual edit scope.
- No authentication or authorization layer exists today; any addition requires an explicit
	governance decision.

## Development Workflow

- Feature work flows through change request or spec, then plan, then tasks before
	implementation.
- Tests are written and run at the smallest useful scope before broadening to repo-wide
	validation.
- Documentation and contracts are updated in the same change as behavioral code.

## Governance

The constitution overrides any conflicting guidance in docs, prompts, or comments. Amendments
MUST be written here first, include a version bump and sync impact report, and be validated
against the plan, spec, and tasks templates plus any affected agent guidance. Compliance is
reviewed during change-request and implementation planning, and unresolved exceptions MUST be
recorded explicitly.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
