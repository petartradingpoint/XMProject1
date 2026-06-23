# `/init` — repo-agnostic baseline (simplified)

A slash command that onboards a brownfield repository to an agentic AI workflow. It produces three context layers — **Cold** (history), **Warm** (stable docs), **Hot** (always-on AI rules) — using whatever sources are available. The point is that **the human always gets a working result**, even when external sources are missing. Gaps are recorded, not blocking.

> Vocabulary: the operator is referred to as the **human** throughout.

---

## 1. Goals

1. Onboard a brownfield repo to an agentic AI workflow without writing application code.
2. Produce three context layers from **whatever the team has**: local repo first, external sources (VCS, tracker, wiki) when available.
3. Keep the human in the loop **before** any repo files are written: pre-init proposes, human approves (or skips), orchestrator executes.
4. **Never block on missing data.** Record gaps in the report and proceed.

**Non-goals**: no source-code edits; no CI changes; no secrets handling; no destructive operations on existing instructions.

---

## 2. Two-phase flow

```
                  ┌─────────────────────────────────────────┐
                  │ Phase 1 — PRE-INIT                       │
                  │ (read-only discovery + approval)         │
                  └────────────────┬────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
  Repo scanner          External resolvers          Existing-artifacts
  (file tree, CI,       (optional — VCS, tracker,    reader (existing
   manifests, scripts,   wiki, service catalog —     AI instructions,
   README,               see §6)                      docs/, ADRs)
   CONTRIBUTING)
        └──────────────────────────┼──────────────────────────┘
                                   ▼
                  ┌─────────────────────────────────────────┐
                  │ DISCOVERY REPORT shown to human          │
                  │  • What was found locally                │
                  │  • Proposed file plan per layer          │
                  │  • Gaps / open questions (with skip ok)  │
                  └────────────────┬────────────────────────┘
                                   │ Human approves / edits / skips items
                                   ▼
                  ┌─────────────────────────────────────────┐
                  │ Phase 2 — INIT ORCHESTRATOR              │
                  └────────────────┬────────────────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  ▼                ▼                ▼
           Cold sub-agent    Warm sub-agent    Hot sub-agent
           (history)         (stable docs)     (always-on rules)
                  │                │                │
                  └────────────────┴────────────────┘
                                   ▼
                       Final summary written to
                       docs/archive/init-history/<date>.md
```

---

## 3. Phase 1 — Pre-init

### 3.1 What it does

Read-only discovery from **local repo only** by default. The agent gathers:

- File tree, package manifests, CI configs, test/lint scripts
- Existing AI instructions (`.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`, `.junie/guidelines.md`, etc.) — see §6
- `README.md`, `CONTRIBUTING.md`, anything under `docs/`
- ADRs / TDRs already in the repo (`docs/adr/`, `docs/architecture/decisions/`)

External sources (VCS history, issue tracker, wiki) are **optional** — see §6 for the placeholders. If none are configured, the agent uses only local signal plus a short interview.

### 3.2 Short interview (always runs, max 4 questions)

The agent asks the human at most four questions, only the ones it couldn't infer from the repo:

1. Primary stack + runtime version (only if auto-detection failed or returned `mixed`)
2. Test runner + lint/typecheck commands (only if not detected from manifests)
3. Top 3 "be careful" areas — modules, files, or domains where mistakes cost most
4. Domain shorthand: acronyms, bounded contexts, key entities

Any question the human can't answer — they reply `skip`. The agent records it as a gap and moves on.

### 3.3 Discovery report

A single markdown rendered to the human in `.init-cache/approved-plan.md`:

```markdown
---
status: pending          # pending | approved
---

# Init discovery — <repo-slug>

## What I found
- Stack: <auto-detected, e.g. "Spring Boot 3 + Java 21 + JUnit 5">
- Existing AI artifacts: <list, or "none">
- Existing docs: <list, or "none">

## Proposed file plan

### Cold — docs/archive/
- (empty if no PR/ticket history fetched — see §6)

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

**No blocking rule.** The human can approve with gaps and skipped questions — the orchestrator proceeds, marks the missing sections as `SKELETON` (see §5), and records the gap in the final summary.

### 3.4 Pre-init outputs (all under `.init-cache/`)

```
.init-cache/
├── repo-scan.json               # Local detector results
├── existing-instructions/        # verbatim copies of in-repo AI instructions
└── approved-plan.md              # The approved discovery report
```

`.init-cache/` is added to `.gitignore` at the start of Phase 1.

---

## 4. Phase 2 — Orchestrator

The orchestrator reads `approved-plan.md` and dispatches three sub-agents.

### 4.1 Execution

All three sub-agents run in parallel. They write to disjoint paths (`docs/archive/`, `docs/context/`, AI-instructions root) so there are no conflicts. All read from `.init-cache/` only; no external re-fetching.

### 4.2 Cold sub-agent

**Inputs:** whatever PR/ticket data ended up in `.init-cache/` (often nothing — see §6).

**Outputs:** `docs/archive/<work_id>/README.md` per fetched work item.

If `.init-cache/` has no PR/ticket data, Cold writes a single placeholder at `docs/archive/README.md`:

```markdown
# Archive — not populated yet

No PR/ticket history was fetched on this init run.
Re-run `/init --refresh` once a VCS / issue-tracker integration is configured (see init_baseline.md §6).
```

### 4.3 Warm sub-agent

**Outputs** — all under `docs/context/`:

- `stack.md` — language, framework, runtime, package manager, test runner, lint/typecheck, CI gates. Filled from repo-scan + interview answer 1.
- `repo-constitution.md` — repo identity: purpose, intents, non-goals, principles, constraints, stakeholders. Filled from README, existing instructions, and interview answer 3.
- `architecture.md` — repo layout (top-level directories, entry points) + any decisions found in existing ADRs.

Each file lists its source paths at the bottom.

**Existing files are preserved.** If a target already exists, Warm writes a `.proposed` sibling instead of overwriting.

### 4.4 Hot sub-agent

**Outputs:**

- `<ai-instructions-root>/copilot-instructions.md` or `AGENTS.md` (depending on the tool the human uses) — always-on operational rules.

Template:

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

If existing AI instructions exist (e.g. an old `copilot-instructions.md`), Hot merges by appending new sections and preserving everything the existing file already says. **Never deletes.** Conflicts surface in the final summary, not silently merged.

---

## 5. Empty-repo / thin-source behavior

When external sources are absent or the repo is brand new (no PRs, no ADRs, sparse README), `/init` **still proceeds**. Each warm/hot file is created with an explicit skeleton marker for any section the agent couldn't fill:

```markdown
<!-- SKELETON: no source content for this section.
     Fill in manually or re-run /init once sources exist. -->
```

The final summary lists every skeleton-marked section so the human can backfill later.

---

## 6. External integration placeholders (NOT WIRED — for future)

> **Workshop scope:** for the workshop run, treat all of this section as commented-out / not implemented. The slash command produced from this baseline should **skip** external fetching entirely and rely on local repo + the short interview. Recording gaps is enough.

These integrations are how Phase 1 gets richer signal once your AI tool can talk to them via MCP servers or APIs. Until then — placeholders.

```text
# TODO(integrations): wire these up when MCP servers / API tokens are available.
#
# - vcs:           # GitHub / GitLab / Bitbucket — fetch last 5–10 merged PRs,
#                  # PR titles + bodies + linked tickets, code-owners.
# - tracker:       # Jira / Linear / Azure DevOps — fetch tickets referenced
#                  # from PR titles, with epic / parent context.
# - wiki:          # Confluence / Notion / Slab — fetch team contract,
#                  # architecture pages, technical decision records.
# - service-catalog:  # Backstage / etc. — fetch the catalog entity for the repo.
```

When wired, these populate:
- **Cold:** PR + ticket archive entries
- **Warm:** richer `repo-constitution.md` (from wiki) and `architecture.md` (from architecture pages, ADRs)
- **Hot:** team-contract rules → operational do/don't

Until then: missing integration = recorded gap, no failure.

---

## 7. Existing instructions — preserved as a source

Existing AI/agent instructions are **first-class inputs**, not obstacles. Files the agent looks for and copies verbatim into `.init-cache/existing-instructions/`:

- `.github/copilot-instructions.md`
- `AGENTS.md`, `CLAUDE.md`
- `.cursor/rules/*`, `.cursorrules`
- `.junie/guidelines.md`, `.junie/commands/*`
- `README.md`, `CONTRIBUTING.md`

**Hard rule:** init **never deletes** an existing instruction file or section. If the new layout has no place for content, that content moves to `docs/context/legacy-instructions.md` with a note explaining where it came from.

---

## 8. Implementation note — one command, not four

The spec describes three "sub-agents" (Cold / Warm / Hot) for **conceptual clarity** — they own disjoint output paths so their work doesn't conflict. **In implementation this is a single slash command**, not four separate skills:

- **Copilot:** one file at `.github/prompts/init.prompt.md`.
- **Junie:** one file at `.junie/commands/init.md`.

The body of that one prompt walks the agent through:

1. Phase 1 — local scan + short interview + write `.init-cache/approved-plan.md`.
2. Wait for human approval (re-read `approved-plan.md`, check `status: approved`).
3. Phase 2 — write the Cold section, then the Warm section, then the Hot section, in one continuous pass. Disjoint paths mean no conflicts; order doesn't matter for correctness.
4. Write the final summary at `docs/archive/init-history/<YYYY-MM-DD>.md`.
5. Delete `.init-cache/`.

Do not spawn separate skill files for Cold / Warm / Hot. Do not try to use a `Task`-style parallel-agent primitive (Copilot / Junie don't have one). Just one prompt, sequential execution.

### Suggested top-level frontmatter

For Copilot (`.github/prompts/init.prompt.md`):
```yaml
---
description: Onboard this repo to an AI workflow — produce Hot/Warm/Cold context layers.
mode: agent
---
```

For Junie (`.junie/commands/init.md`):
```yaml
---
description: Onboard this repo to an AI workflow — produce Hot/Warm/Cold context layers.
---
```

---

## 9. Final summary

At the end of a successful run, the orchestrator writes `docs/archive/init-history/<YYYY-MM-DD>.md`:

- Files created / updated
- Sections marked `SKELETON` (with paths)
- Recorded gaps (missing integrations, skipped interview questions, preserved-but-unmerged conflicts)
- Suggested next actions: which gaps would unblock the most signal if filled

Then `.init-cache/` is deleted.
