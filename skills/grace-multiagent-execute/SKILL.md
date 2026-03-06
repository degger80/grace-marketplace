---
name: grace-multiagent-execute
description: "Execute a GRACE development plan with multiple agents in parallel waves. Use when the architecture is planned, several modules are independent, and you need a controller-managed workflow that preserves contracts, reviews, and knowledge graph integrity."
---

Execute a GRACE development plan with multiple agents while keeping planning artifacts and shared context consistent.

## Prerequisites
- `docs/development-plan.xml` must exist with module contracts and implementation order
- `docs/knowledge-graph.xml` must exist
- If either is missing, tell the user to run `$grace-plan` first
- If the shell does not already have GRACE worker/reviewer presets, use `$grace-setup-subagents` before dispatching a large wave

## Core Principle

Parallelize **module implementation**, not **architectural truth**.

- One controller owns shared artifacts: `docs/development-plan.xml`, `docs/knowledge-graph.xml`, phase status, and execution queue
- Worker agents own only their assigned module files and module-local tests
- Reviewers validate module outputs before the controller merges graph and plan updates

If multiple agents edit the same module, the same shared XML file, or the same tightly coupled slice — this is not a multi-agent wave. Use `$grace-execute` instead.

## Process

### Step 1: Build the Execution Waves
Read `docs/development-plan.xml` and `docs/knowledge-graph.xml`.

1. Parse pending `Phase-N` and `step-N` entries
2. Group steps into **parallel-safe waves**
3. A step is parallel-safe only if:
   - all of its dependencies are already complete
   - it has a disjoint write scope from every other step in the wave
   - it does not require shared edits to the same integration surface
4. For each wave, prepare:
   - module IDs
   - target file paths
   - dependency contracts
   - verification commands

Present the proposed waves to the user and wait for approval before dispatching agents.

### Step 2: Assign Ownership
Before dispatching, define ownership explicitly:

- **Controller**:
  - owns `docs/development-plan.xml`
  - owns `docs/knowledge-graph.xml`
  - owns phase completion and commits that touch shared artifacts
- **Worker agent**:
  - owns one module or one explicitly bounded slice
  - may edit only that module's source files and module-local tests
  - must not change shared planning artifacts directly
- **Reviewer agent**:
  - read-only validation of contract compliance, GRACE markup, imports, and verification evidence

If a worker discovers that a missing module or new dependency is required, stop that worker and ask the user to revise the plan before proceeding. Do not allow silent architectural drift.

### Step 3: Dispatch Worker Agents Per Wave
For each approved wave:

1. Dispatch one fresh worker agent per module
2. Give each worker:
   - module ID and purpose
   - the module's contract from `docs/development-plan.xml`
   - the module's graph entry from `docs/knowledge-graph.xml`
   - dependency contracts for every module in `DEPENDS`
   - exact write scope
   - verification expectations
3. Require the worker to:
   - generate or update code using the `$grace-generate` protocol
   - preserve MODULE_CONTRACT, MODULE_MAP, CHANGE_SUMMARY, function contracts, and semantic blocks
   - add or update module-local tests
   - produce a **graph delta proposal** instead of editing shared XML directly when the environment makes parallel XML edits risky

### Step 4: Review Each Worker Output
After each worker finishes:

1. Run a reviewer using `$grace-reviewer`
2. Validate:
   - contract compliance
   - semantic markup integrity
   - imports vs `DEPENDS`
   - test and verification results
   - proposed graph changes
3. If issues are found:
   - send the same worker back to fix them
   - re-run review
4. Only approved module outputs may move to controller integration

### Step 5: Controller Integration
After all modules in the wave are approved:

1. Integrate the accepted module outputs
2. Update `docs/knowledge-graph.xml` once, centrally:
   - add module entries if needed
   - apply CrossLinks from actual imports
   - update annotations from real exports
3. Update `docs/development-plan.xml` status for completed steps
4. Run `$grace-refresh` to detect drift introduced by the wave
5. If the wave introduced weak or missing automated checks, use `$grace-verification` before moving on

### Step 6: Commit and Report
Commit in two layers:

- Module commits or worker commits for disjoint implementation slices
- Controller commit for shared artifact updates, wave completion, or phase completion

After each wave, report:

```text
=== WAVE COMPLETE ===
Wave: N
Modules: M-xxx, M-yyy
Approved: count/count
Graph sync: passed / fixed
Verification: passed / follow-up required
Remaining waves: count
```

## Dispatch Rules
- Parallelize only across independent modules, never across unknown coupling
- Prefer small waves over maximum concurrency
- Do not let workers invent new architecture
- Do not let workers edit the same XML planning artifacts in parallel
- Give every worker exact file ownership and exact success criteria
- Reuse reviewer criteria from `$grace-reviewer`
- Prefer controller-applied graph updates when the execution environment makes merge conflicts likely

## When NOT to Use
- Only one module remains
- Steps are tightly coupled and share the same files
- The plan is still changing frequently
- The team has not defined reliable verification yet

Use `$grace-execute` for sequential execution when dependency risk is higher than the parallelism gain.
