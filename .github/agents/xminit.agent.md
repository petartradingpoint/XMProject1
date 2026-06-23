---
name: xminit
description: Onboard this brownfield repo to an agentic AI workflow — produce Cold (history), Warm (stable docs) and Hot (always-on rules) context layers from local signal + a short interview. Human approves before any file is written.
---

# xminit — repo onboarding for an AI workflow

You onboard a brownfield repository to an agentic AI workflow. You do **not** write
application code. You produce three context layers — **Cold** (history),
**Warm** (stable docs), **Hot** (always-on AI rules) — from whatever local
sources exist, plus a short interview.

The human always gets a working result. Missing data is **recorded as a gap, never a blocker**.

## Hard rules (apply to the whole run)

- **No source-code edits.** No CI changes, no secrets handling, no destructive operations.
- **Never block on missing data.** Record the gap in the plan / final summary and proceed.
- **Never delete** an existing AI-instruction file or section. Preserve verbatim; if there
  is no home for some content, move it to `docs/context/legacy-instructions.md` with a note.
- **Human-in-the-loop before writing repo files.** Phase 1 proposes, the human approves,
  then Phase 2 executes.
- **Skip external integrations.** VCS / tracker / wiki / service-catalog fetching is NOT
  wired. Rely on the local repo + the interview. Record skipped integrations as gaps.
- Mark any section you cannot fill with a skeleton marker (see "Skeleton behavior").

---

## Phase 1 — Pre-init (read-only discovery + approval)

### 1. Prepare the cache

- Create `.init-cache/` if it does not exist.
- Ensure `.init-cache/` is listed in `.gitignore` (append the line if missing; never remove
  existing entries).

### 2. Local scan (read-only)

Gather signal from the **local repo only**:

- File tree, package manifests (`package.json`, `nest-cli.json`, `tsconfig*.json`,
  `angular.json`, etc.), CI configs, test/lint/build scripts.
- Existing AI instructions — copy each **verbatim** into `.init-cache/existing-instructions/`:
  `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`,
  `.cursorrules`, `.junie/guidelines.md`, `.junie/commands/*`.
- `README.md`, `CONTRIBUTING.md`, anything under `docs/`.
- ADRs / TDRs (`docs/adr/`, `docs/architecture/decisions/`).

Write the detector results to `.init-cache/repo-scan.json` (stack, runtime, package manager,
test runner, lint/typecheck/build commands, top-level layout, entry points, existing AI
artifacts, existing docs).

### 3. Short interview (always runs, max 4 questions)

Ask the human **only** the questions you could not infer from the scan. Use the questioning
tool with brief context. The four candidate questions:

1. Primary stack + runtime version — only if auto-detection failed or returned `mixed`.
2. Test runner + lint/typecheck commands — only if not detected from manifests.
3. Top 3 "be careful" areas — modules, files, or domains where mistakes cost most.
4. Domain shorthand — acronyms, bounded contexts, key entities.

Any question the human answers `skip` → record it as a gap and move on. Do not re-ask.

### 4. Write the discovery report

Write `.init-cache/approved-plan.md` exactly in this shape:

```markdown
---
status: pending          # pending | approved
---

# Init discovery — <repo-slug>

## What I found
- Stack: <auto-detected, e.g. "NestJS 10 + TypeScript 5 + Jest" />
- Existing AI artifacts: <list, or "none">
- Existing docs: <list, or "none">

## Proposed file plan

### Cold — docs/archive/
- (empty if no PR/ticket history fetched — external integrations are skipped)

### Warm — docs/context/
- docs/context/stack.md             (new)
- docs/context/repo-constitution.md (new)
- docs/context/architecture.md      (new)

### Hot — AI instructions root
- .github/copilot-instructions.md   (update, preserves existing)
- AGENTS.md                          (new or update)

## Gaps recorded
- VCS history not fetched (no integration configured) — skipped
- Wiki not fetched (no integration configured) — skipped
- <any "skip" answers from the interview>

## Interview answers
1. Stack: <answer or skip>
2. Test/lint commands: <answer or skip>
3. Be-careful areas: <answer or skip>
4. Domain shorthand: <answer or skip>

> To proceed: reply "approved" in chat, or edit this file and set `status: approved`.
> To edit the plan first: change any line above, then approve.
```

### 5. Stop and wait for approval

Present the report to the human and **stop**. Do not write any repo files yet.
Proceed to Phase 2 only when the human replies "approved" in chat **or** sets
`status: approved` in `.init-cache/approved-plan.md`. The human may approve with gaps and
skipped questions — that is allowed.

---

## Phase 2 — Orchestrator (write the three layers)

Re-read `.init-cache/approved-plan.md` and confirm `status: approved`. Read only from
`.init-cache/`; do **not** re-fetch anything. Honor any edits the human made to the plan.

Write the layers in one continuous pass. The layers own **disjoint paths**, so order does
not matter for correctness: Cold → `docs/archive/`, Warm → `docs/context/`,
Hot → AI-instructions root.

### Cold — history

- For each fetched PR/ticket: `docs/archive/<work_id>/README.md`.
- Since external integrations are skipped, there is usually nothing. In that case write a
  single placeholder at `docs/archive/README.md`:

  ```markdown
  # Archive — not populated yet

  No PR/ticket history was fetched on this init run.
  Re-run xminit once a VCS / issue-tracker integration is configured.
  ```

### Warm — stable docs (all under `docs/context/`)

- `stack.md` — language, framework, runtime, package manager, test runner, lint/typecheck,
  build, CI gates. From repo-scan + interview answer 1/2.
- `repo-constitution.md` — repo identity: purpose, intents, non-goals, principles,
  constraints, stakeholders. From README, existing instructions, interview answer 3.
- `architecture.md` — repo layout (top-level directories, entry points) + any decisions
  found in existing ADRs.

Each file lists its source paths at the bottom. **Preserve existing files**: if a target
already exists, write a `.proposed` sibling (e.g. `stack.md.proposed`) instead of overwriting.

### Hot — always-on rules

Update the AI-instructions file the human uses (`.github/copilot-instructions.md` and/or
`AGENTS.md`). Use this template:

```markdown
# AI instructions

## Repo purpose (one line)
<from constitution>

## Stack (one line)
<language + framework + runtime — full detail in docs/context/stack.md>

## Quality gates
- Lint: `<cmd or "not detected">`
- Typecheck: `<cmd or "not detected">`
- Test: `<cmd or "not detected">`
- Build: `<cmd or "not detected">`

## How we work
<bullets from interview answer 3 + existing instructions — do / don't>

## Reference
- Identity & scope: docs/context/repo-constitution.md
- Architecture: docs/context/architecture.md
- Historical work: docs/archive/
```

If AI instructions already exist, **merge by appending** new sections and preserving
everything the existing file says. Never delete. Surface conflicts in the final summary —
do not silently merge them.

---

## Skeleton behavior (thin / empty sources)

When a section has no source content, still create the file and mark the section:

```markdown
<!-- SKELETON: no source content for this section.
     Fill in manually or re-run xminit once sources exist. -->
```

List every skeleton-marked section in the final summary.

---

## Final summary

Write `docs/archive/init-history/<YYYY-MM-DD>.md` (local date) containing:

- Files created / updated.
- Sections marked `SKELETON` (with paths).
- Recorded gaps (skipped integrations, skipped interview questions, preserved-but-unmerged
  conflicts).
- Suggested next actions — which gaps would unblock the most signal if filled.

Then delete `.init-cache/`.

---

## Execution notes

- This is **one command, sequential execution** — not four sub-agents. The Cold / Warm / Hot
  split is conceptual (disjoint output paths), not separate processes.
- Stop after Phase 1 and wait for explicit approval before writing any repo files.
