# FlightCode — the code-structure standard

> **Canonical home.** This document is the standard. It lives in
> `@btrmnt/eslint-plugin-flightcode` so the prose and the enforcement it
> describes version together — a repo that pins `v0.0.2` pins this text too.
> It moved here from `~/base/docs/FLIGHTCODE.md` on 2026-07-29 (Sam); a pointer
> stub remains at the old path.

## Where each piece of FlightCode lives

Recorded because it took real effort to rediscover, twice. Read this before
concluding a piece is missing.

| Piece | Where | Why there |
|---|---|---|
| **The standard** (this doc) | `eslint-plugin-flightcode/docs/FLIGHTCODE.md` | Versions in lockstep with the package that enforces it. |
| **The enforcement** | `eslint-plugin-flightcode` — `configs.recommended`, `relaxZones()`, custom AST rules | Distributed as a public git-tag dep; a repo pins a tag, and the pin is the freeze. |
| **Per-repo adoption status** | `~/base/.claude/flightcode-status.json` (machine, authoritative) + `~/base/docs/FLIGHTCODE_STATUS.md` (human mirror) | **Stays private and stays at that exact path** — the PostToolUse hook reads the JSON there, and the registry names client repos. |
| **Write-time enforcement** | `~/base/.claude/hooks/check-flightcode.py` | Reads the registry directly; warns on touched-code violations before CI ever runs. |
| **Per-repo concrete companions** | `highland/docs/DOC-STANDARD.md`, `littleoak-cherry/docs/DOC-STANDARD.md` | Deliberately repo-specific: locked local values, gate-vs-census scope, house prologue shapes. **Not** canonical, and not duplicates of each other. |
| **Rule docs** | `eslint-plugin-flightcode/docs/rules/*.md` | One per custom AST rule. |
| **Historical bundle** | `~/base/handoffs/flightcode-complete/` (snapshot, 2026-07-09) | A point-in-time export. **Treat as stale** — it predates the shared package landing and highland's caps being tightened. |

> **The mistake this table prevents.** `littleoak-cherry/docs/DOC-STANDARD.md`
> is its house standard, referenced by that repo's own `eslint.config.js` and by
> section number from five sibling docs. It is not the canonical standard and
> must not be moved here.


> **Name (Sam, 2026-07-02):** this standard is called **FlightCode** — the code-shape rules only
> (80-col, 60-line functions, TSDoc prologues/file headers, bounded constructs, depth/params/
> complexity caps, boundary assertions, generic-at-the-seam). NOT the evidence gate (Pillar A)
> or the zero-knowledge docs (Pillar B), which are separate systems that reference it.
> Locked house values + enforcement: each adopting repo's own
> `docs/DOC-STANDARD.md` + `eslint.config.js` + `check:flightcode` gate + CI
> (first: littleoak-cherry).
> (Formerly "Disciplined Code Principles"; old filename kept as a pointer stub.)

> **Purpose.** A distilled, language-agnostic playbook drawn from three classic sources Sam
> learned in *Fundamentals of C Programming* (UTS). The originals target strict ANSI C for
> safety-critical/NASA flight software; this document extracts the *principles* so they can be
> adapted to a modern codebase (e.g. the TypeScript **littleoak / Cherry** project).
>
> **Who this binds.** Every session writing code in a repo declared `full-gate` or
> `touched-only` in `.claude/flightcode-status.json`. Read `FLIGHTCODE_STATUS.md` for the
> repo's status before writing code. **Exception:** repos declared `none`, plus the file-level
> exclusions in `~/.claude/CLAUDE.md` (generated, vendored, config and data files).
>
> **FlightCode is normative.** Its rules bind new code, substantially-rewritten code, and
> touched lines in existing files. Several C-specific rules (manual memory, pointers) have no
> analog in TS and must be translated, not copied.

---

## Versioning — the standard evolves; repos pin a version, the past is never rewritten

FlightCode is **versioned**, and the version *is* the version of the shared enforcement package
[`@btrmnt/eslint-plugin-flightcode`](https://github.com/sambtrmntai/eslint-plugin-flightcode):

- **The version = the package semver.** A **minor** bump adds/tightens a requirement (e.g. `0.0.x` →
  `0.1.0` adds strict `max-len`). A **patch** bump is a non-normative fix (rule false-positive tuning,
  a bug) that does **not** change what the standard requires.
- **A repo pins a version** by pinning the package git tag in its `package.json`
  (`"@btrmnt/eslint-plugin-flightcode": "git+https://github.com/sambtrmntai/eslint-plugin-flightcode.git#v0.0.2"`). **The pin
  is the freeze.** A repo stays on the version it pinned until it *deliberately* bumps the tag and
  re-runs `check:flightcode`. So evolving the standard **never rewrites the past** — existing repos
  are untouched until they choose to move.
- **New repos default to the newest version** — onboarding pins the latest published tag (see
  `FLIGHTCODE_STATUS.md` → "Onboarding a new repo"). So new code gets the current standard for free;
  old code isn't force-migrated.
- **Each full-gate repo's pinned version is recorded** in `.claude/flightcode-status.json`
  (`flightcodeVersion`), so the registry shows who's on what.

### Version history

| Version | Status | What it requires (delta from previous) |
|---|---|---|
| **`0.0.2`** | **current** (tag `v0.0.2`) | The shared package: `configs.recommended` (caps 10/3/4/60, 80-col via Prettier `printWidth`, jsdoc prologue, `eslint-comments` deviation protocol) + `relaxZones()` helper + 4-space indent + custom rules `bounded-loop-requires-cap` (error) and `no-bare-json-parse` (error, test carve-out). **80-col is enforced on code *structure* only** — string/template-literal and comment *content* are exempt (Prettier can't split them without changing values); wrap those by judgment. *(Distributed as a public git-tag dep at `sambtrmntai/eslint-plugin-flightcode`; v0.0.2 = v0.0.1 + committed `dist/` and no `prepare` script — a packaging patch so tokenless git installs need no build-script allowlist. Standard requirements identical to 0.0.1.)* |
| **`0.1.0`** | planned (not built) | Adds a strict `max-len` ESLint rule to close the 80-col gap on string/comment content. Deferred deliberately — scoped in `handoffs/highland/CJ/flightcode-handback/MAXLEN_ENFORCEMENT_SCOPE.md` (the cost is ~entirely hand-wrapping legit SQL/narration/comments; only worth it phased, per-repo burndown). Repos adopt it by bumping their pin to `v0.1.0` when ready. |

---

## The three sources (and what each one governs)

| # | Source | Year / origin | Governs |
|---|--------|---------------|---------|
| 1 | **ANSI C89 / ISO C90** | ANSI 1989 / ISO 1990 | The *language dialect* — the strict, portable baseline. Compiled with `-ansi -pedantic -Wall`, warnings-as-errors. |
| 2 | **NASA C Style Guide** (SEL-94-003) | NASA Goddard, 1994 | *Formatting & documentation* — line length, file/function header comment blocks. |
| 3 | **The Power of 10** | Gerard Holzmann, NASA **JPL**, 2006 (*IEEE Computer*) | *Safety-critical coding rules* — bounded loops, no recursion, no runtime allocation, assertions, static analyzability. |

The three sources above are separate documents that a course or codebase layers together: pick a strict
language mode, format & document it rigorously, and constrain it to be analyzable.

---

## Pillar 1 — Strict language mode (from ANSI C89 practice)

**Principle:** commit to the strictest, most-analyzable dialect of your language and make the
compiler/linter reject anything outside it. Portability and analyzability beat convenience.

C89 specifics (historical reference):
- `/* */` comments only — no `//` (that arrived in C99).
- All variable declarations at the top of a block.
- No variable-length arrays, no `bool`, no `long long` (all C99+).
- No string *type* — strings are just `char[]` terminated by `\0`.
- Compile flags: `-ansi` (= `-std=c90`) `-pedantic` `-Wall`, treat warnings as errors.

**Translation to a modern TS/JS project:**
- `tsconfig` in `strict` mode (plus `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`).
- ESLint with a strict, curated ruleset; **warnings-as-errors in CI** (`--max-warnings 0`).
- No `any`, no `@ts-ignore` without a justifying comment.
- Pin one language target / module mode; don't rely on transpiler sugar that hides intent.

---

## Pillar 2 — Rigorous documentation & formatting (from the NASA C Style Guide)

**Principle:** every unit of code carries a machine-readable contract in its header comment, and
lines stay short enough to read on any display.

### 2a. Line-length limit
- Classic rule: **≤ 80 characters per line** (some rubrics say 79).
- Origin: fixed-width terminals / 80-column cards.
- Long statements are broken deliberately across lines rather than run wide.
- *Translation:* set Prettier `printWidth` (80 or your house value) and enforce it in CI.

### 2b. File header block
At the top of each source file:
- Filename
- Author(s)
- Date / creation + modification history
- Purpose of the file

### 2c. Function prologue (the header comment before every function)
The contract you had to write before *each* function. Required fields (names vary by rubric):

```c
/*
 * Function:    computeAverage
 * Description: Computes the arithmetic mean of an array of scores.
 * Inputs:      scores - array of integer test scores
 *              count  - number of elements in the array
 * Outputs:     none (no pointers/globals modified)
 * Returns:     the mean as a double; 0.0 if count <= 0
 * Format:      scores must be non-negative; count must match array length
 * Assumptions: caller guarantees the array is valid
 */
```

Canonical field set:
- **Name** of the function
- **Description / Purpose** — what it does
- **Inputs / Parameters** — each argument and meaning
- **Outputs** — anything modified via pointers/globals/side effects
- **Returns** — the return value and its meaning
- **Format / Preconditions** — valid input ranges, invariants
- **Assumptions / Notes** — and optionally Author / Date / mod history

**Translation to TS/JS:**
- Use **TSDoc/JSDoc** as the structured prologue: `@param`, `@returns`, `@throws`,
  `@remarks` (preconditions/assumptions), a one-line summary, and a longer description.
- Types already encode much of "Inputs/Outputs/Format", so the prose must carry what types
  *cannot*: intent, preconditions, side effects, invariants, failure modes.
- Exported units must carry a TSDoc prologue. `jsdoc/require-jsdoc`, `jsdoc/require-param`,
  and `jsdoc/require-returns` enforce this rule as errors in every full-gate repo, so the
  contract can't silently go missing.

---

## Pillar 3 — Constrain for analyzability (the Power of 10)

**Principle:** write code whose correctness a human reviewer *and* a static analyzer can verify.
Every rule exists to remove a construct that defeats analysis.

The 10 rules (Holzmann, JPL 2006):

1. **Simple control flow** — no `goto`, no `setjmp`/`longjmp`, **no recursion**.
2. **All loops have a fixed upper bound** — provably terminate; a checkable ceiling on iterations.
3. **No dynamic memory allocation after initialization** — no runtime `malloc`.
4. **Short functions** — fit on one page (~60 lines); one function, one job.
5. **≥ 2 assertions per function** on average — assert preconditions, postconditions, invariants.
6. **Smallest possible scope** for every data object.
7. **Check every return value**; **validate every parameter** inside the function.
8. **Limited preprocessor use** — simple includes/macros only; no token-pasting cleverness.
9. **Restricted pointers** — ≤ one level of dereference; no function pointers.
10. **Compile clean** — all warnings on, pedantic, **zero warnings tolerated**.

**Translation to a modern TS/JS project (what maps, what doesn't):**

| Rule | TS/JS analog |
|------|--------------|
| 1. Simple control flow | Avoid deep/clever control flow; recursion allowed but bounded & justified. |
| 2. Bounded loops | Prefer bounded iteration; cap retries/pagination; avoid unbounded `while(true)` without an exit invariant. |
| 3. No runtime alloc | *Largely N/A* (GC language). Analog: bound in-memory growth — cap queues/caches/buffers, stream large data. |
| 4. Short functions | Keep functions small & single-purpose; ESLint `max-lines-per-function`, `complexity`. |
| 5. Assertions | Runtime invariant checks / `assert` / schema validation (e.g. zod) at boundaries; fail fast & loud. |
| 6. Smallest scope | `const` by default, declare at use site, no needless module-level mutable state. |
| 7. Check returns/params | Handle every `Promise` rejection & error union; validate inputs at trust boundaries; no swallowed errors. |
| 8. Limited preprocessor | *N/A.* Analog: limit codegen/decorator/metaprogramming magic that obscures control flow. |
| 9. Restricted pointers | *N/A.* Analog: do not use deep mutable aliasing. Use immutable data and shallow structures. |
| 10. Compile clean | `tsc --noEmit` + ESLint with **zero warnings** as a hard CI gate. |

Rules 3, 8, 9 are C-memory-model artifacts — keep their *spirit* (bound resource growth, avoid
obscuring magic, avoid tangled aliasing), don't force a literal port.

---

## The payoff (why Sam wants this)

- **Documentation** — every function/file carries an enforced, structured contract; readers never
  reverse-engineer intent from the body.
- **Readability** — short lines, short single-purpose functions, minimal scope, no clever control flow.
- **Verifiability** — bounded loops + assertions + validated inputs + strict types mean correctness
  is checkable by review *and* by tooling, not just by running it.
- **Debuggability** — fail-fast assertions and checked returns surface faults at their origin, not
  three layers downstream; small functions localize blame.

---

## Suggested next step (for the littleoak session)

Feed this doc + the littleoak/Cherry repo to a fresh session and ask it to produce:
1. A **gap analysis** — which principles the codebase already honors vs. violates.
2. A **littleoak-specific adaptation** — the concrete `tsconfig`/ESLint/Prettier/TSDoc rules and a
   house function-prologue template, dropping the C-only rules.
3. An **enforcement plan** — which rules become CI-blocking gates vs. review-guidance, and a
   phased rollout (new code first, then backfill).
4. A **worked example** — one existing module refactored to the standard, as the reference pattern.

---

### Sources
- ANSI X3.159-1989 (C89) / ISO/IEC 9899:1990 (C90) — same standard, two names.
- NASA C Style Guide, **SEL-94-003**, NASA Goddard Space Flight Center, 1994.
- G. J. Holzmann, "The Power of 10: Rules for Developing Safety-Critical Code," *IEEE Computer*, 2006 (NASA/JPL).
