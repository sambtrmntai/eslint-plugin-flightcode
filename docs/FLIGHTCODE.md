# FlightCode — the code-structure standard

> **Canonical home.** This document is the standard. It lives in
> `@btrmnt/eslint-plugin-flightcode` so the prose and the enforcement it
> describes version together — a repo that pins `v0.0.2` pins this text too.
> It moved here from `~/base/docs/FLIGHTCODE.md` on 2026-07-29 (Sam); a pointer
> stub remains at the old path.

## Where each piece of FlightCode lives

Recorded because it took real effort to rediscover, twice. Read this before
concluding a piece is missing.

| Piece                                    | Where                                                                                                                | Why there                                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The standard** (this doc)              | `eslint-plugin-flightcode/docs/FLIGHTCODE.md`                                                                        | Versions in lockstep with the package that enforces it.                                                                                            |
| **The enforcement**                      | `eslint-plugin-flightcode` — `configs.recommended`, `relaxZones()`, custom AST rules                                 | Distributed as a public git-tag dep; a repo pins a tag, and the pin is the freeze.                                                                 |
| **Per-repo adoption status**             | `~/base/.claude/flightcode-status.json` (machine, authoritative) + `~/base/docs/FLIGHTCODE_STATUS.md` (human mirror) | **Stays private and stays at that exact path** — the PostToolUse hook reads the JSON there, and the registry names client repos.                   |
| **Write-time enforcement**               | `~/base/.claude/hooks/check-flightcode.py`                                                                           | Reads the registry directly; warns on touched-code violations before CI ever runs.                                                                 |
| **Per-repo concrete companions**         | `highland/docs/DOC-STANDARD.md`, `littleoak-cherry/docs/DOC-STANDARD.md`                                             | Deliberately repo-specific: locked local values, gate-vs-census scope, house prologue shapes. **Not** canonical, and not duplicates of each other. |
| **Rule docs**                            | `eslint-plugin-flightcode/docs/rules/*.md`                                                                           | One per custom AST rule.                                                                                                                           |
| **Historical bundle**                    | `~/base/handoffs/flightcode-complete/` (snapshot, 2026-07-09)                                                        | A point-in-time export. **Treat as stale** — it predates the shared package landing and highland's caps being tightened.                           |
| **Deviation/justified-disable protocol** | `~/.claude/CLAUDE.md` (global user instructions)                                                                     | Not yet mirrored here; the `-- <reason>` inline-disable protocol + single-digit budget currently only exist in that file.                          |
| **Per-repo waiver registries**           | `<repo>/docs/FLIGHTCODE_WAIVERS.md` (one per adopting repo)                                                          | Repo-specific by design — see "Waiver-registry contract" above; not duplicated here.                                                               |

> **The mistake this table prevents.** `littleoak-cherry/docs/DOC-STANDARD.md`
> is its house standard, referenced by that repo's own `eslint.config.js` and by
> section number from five sibling docs. It is not the canonical standard and
> must not be moved here.

> **Name (Sam, 2026-07-02):** this standard is called **FlightCode** — the code-shape rules only
> (80-col, 60-line functions, TSDoc prologues/file headers, bounded constructs, depth/params/
> complexity caps, boundary assertions, generic-at-the-seam). NOT the evidence gate (Pillar A)
> or the zero-knowledge docs (Pillar B), which are separate systems that reference it.
> Locked house values + enforcement: each adopting repo's own
> `<repo>/docs/DOC-STANDARD.md` + `<repo>/eslint.config.js` + that repo's
> `check:flightcode` gate + CI
> (first: littleoak-cherry).
> (Formerly "Disciplined Code Principles"; old filename kept as a pointer stub.)

> **Purpose.** A distilled, language-agnostic playbook drawn from three classic sources Sam
> learned in _Fundamentals of C Programming_ (UTS). The originals target strict ANSI C for
> safety-critical/NASA flight software; this document extracts the _principles_ so they can be
> adapted to a modern codebase (e.g. the TypeScript **littleoak / Cherry** project).
>
> **Who this binds.** Every session writing code in a repo declared `full-gate` or
> `touched-only` in `.claude/flightcode-status.json`. Read `~/base/docs/FLIGHTCODE_STATUS.md` for the
> repo's status before writing code. **Exception:** repos declared `none`, plus the file-level
> exclusions in `~/.claude/CLAUDE.md` (generated, vendored, config and data files).
>
> **FlightCode is normative.** Its rules bind new code, substantially-rewritten code, and
> touched lines in existing files. Several C-specific rules (manual memory, pointers) have no
> analog in TS and must be translated, not copied.

---

## Versioning — the standard evolves; repos pin a version, the past is never rewritten

FlightCode is **versioned**, and the version _is_ the version of the shared enforcement package
[`@btrmnt/eslint-plugin-flightcode`](https://github.com/sambtrmntai/eslint-plugin-flightcode):

- **The version = the package semver.** A **minor** bump adds/tightens a requirement (e.g. `0.0.x` →
  `0.1.0` adds rule tiers + admission tests). A **patch** bump is a non-normative fix (rule
  false-positive tuning, a bug) that does **not** change what the standard requires.
- **A repo pins a version** by pinning the package git tag in its `package.json`
  (`"@btrmnt/eslint-plugin-flightcode": "git+https://github.com/sambtrmntai/eslint-plugin-flightcode.git#v0.1.0"`). **The pin
  is the freeze.** A repo stays on the version it pinned until it _deliberately_ bumps the tag and
  re-runs `check:flightcode`. So evolving the standard **never rewrites the past** — existing repos
  are untouched until they choose to move.
- **New repos default to the newest version** — onboarding pins the latest published tag (see
  `~/base/docs/FLIGHTCODE_STATUS.md` → "Onboarding a new repo"). So new code gets the current standard for free;
  old code isn't force-migrated.
- **Each full-gate repo's pinned version is recorded** in `.claude/flightcode-status.json`
  (`flightcodeVersion`), so the registry shows who's on what.

### Version history

| Version     | Status                     | What it requires (delta from previous)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`0.0.2`** | superseded (tag `v0.0.2`)  | The shared package: `configs.recommended` (caps 10/3/4/60, 80-col via Prettier `printWidth`, jsdoc prologue, `eslint-comments` deviation protocol) + `relaxZones()` helper + 4-space indent + custom rules `bounded-loop-requires-cap` (error) and `no-bare-json-parse` (error, test carve-out). **80-col is enforced on code _structure_ only** — string/template-literal and comment _content_ are exempt (Prettier can't split them without changing values); wrap those by judgment. _(Distributed as a public git-tag dep at `sambtrmntai/eslint-plugin-flightcode`; v0.0.2 = v0.0.1 + committed `dist/` and no `prepare` script — a packaging patch so tokenless git installs need no build-script allowlist. Standard requirements identical to 0.0.1.)_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **`0.1.0`** | **current** (tag `v0.1.0`) | Introduces rule tiers (Tier 1/2/3), the rule admission tests, and the exemption hierarchy + waiver-registry contract (see sections above), including the explicit-file-list rule for Tier-4 path zones (a zone must be a literal file list — no wildcards at all — so new files can't enter a relaxed area unnoticed). **⚠️ BREAKING:** `relaxZones()` now _enforces_ this — it throws at config-load time if any entry passed to it isn't a literal path (contains `*`, `?`, `[`, `]`, `{`, `}`, or `!`). A consumer whose `eslint.config.js` currently calls `relaxZones()` with any glob (recursive or not, e.g. `demo/**` or even `demo/*.ts`) will fail to load config the moment it bumps its pin to `v0.1.0`; the fix is to rewrite the zone as an explicit file list before bumping, or — for a genuine file-TYPE deviation like `*.cli.ts` — move it to a plain flat-config block instead of `relaxZones()`. No other repo is force-migrated — the pin is the freeze, so a repo stays on its current version until it deliberately moves. `@typescript-eslint/require-await` moves to Tier 3 (`"off"`, explicit rejection — was never curated, arrived only via `recommendedTypeChecked`; see "Rule admission tests" for the worked-example rationale). The five `@typescript-eslint/no-unsafe-*` rules move to Tier 1 (declarative only — already `"error"` via the preset, now also named in the curated block as Pillar 1 / Power-of-10 rule-7 trust-boundary rules; no behavior change). Strict `max-len` was scoped for this release but deliberately **deferred to `0.2.0`** (Sam, 2026-07-31) — highland alone would take ~33,309 hits, and it needs to run through the new admission tests first. |
| **`0.2.0`** | planned (not built)        | Strict `max-len` ESLint rule to close the 80-col gap on string/comment content. Deferred from 0.1.0 deliberately — scoped in `handoffs/highland/CJ/flightcode-handback/MAXLEN_ENFORCEMENT_SCOPE.md` (the cost is ~entirely hand-wrapping legit SQL/narration/comments; only worth it phased, per-repo burndown, and only after admission-testing against the new Rule tiers framework). Repos adopt it by bumping their pin to `v0.2.0` when ready.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

---

## The three sources (and what each one governs)

| #   | Source                              | Year / origin                                         | Governs                                                                                                                |
| --- | ----------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | **ANSI C89 / ISO C90**              | ANSI 1989 / ISO 1990                                  | The _language dialect_ — the strict, portable baseline. Compiled with `-ansi -pedantic -Wall`, warnings-as-errors.     |
| 2   | **NASA C Style Guide** (SEL-94-003) | NASA Goddard, 1994                                    | _Formatting & documentation_ — line length, file/function header comment blocks.                                       |
| 3   | **The Power of 10**                 | Gerard Holzmann, NASA **JPL**, 2006 (_IEEE Computer_) | _Safety-critical coding rules_ — bounded loops, no recursion, no runtime allocation, assertions, static analyzability. |

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
- No string _type_ — strings are just `char[]` terminated by `\0`.
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
- _Translation:_ set Prettier `printWidth` (80 or your house value) and enforce it in CI.

### 2b. File header block

At the top of each source file:

- Filename
- Author(s)
- Date / creation + modification history
- Purpose of the file

### 2c. Function prologue (the header comment before every function)

The contract you had to write before _each_ function. Required fields (names vary by rubric):

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
  _cannot_: intent, preconditions, side effects, invariants, failure modes.
- Exported units must carry a TSDoc prologue. `jsdoc/require-jsdoc`, `jsdoc/require-param`,
  and `jsdoc/require-returns` enforce this rule as errors in every full-gate repo, so the
  contract can't silently go missing.

---

## Pillar 3 — Constrain for analyzability (the Power of 10)

**Principle:** write code whose correctness a human reviewer _and_ a static analyzer can verify.
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

| Rule                    | TS/JS analog                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1. Simple control flow  | Avoid deep/clever control flow; recursion allowed but bounded & justified.                                  |
| 2. Bounded loops        | Prefer bounded iteration; cap retries/pagination; avoid unbounded `while(true)` without an exit invariant.  |
| 3. No runtime alloc     | _Largely N/A_ (GC language). Analog: bound in-memory growth — cap queues/caches/buffers, stream large data. |
| 4. Short functions      | Keep functions small & single-purpose; ESLint `max-lines-per-function`, `complexity`.                       |
| 5. Assertions           | Runtime invariant checks / `assert` / schema validation (e.g. zod) at boundaries; fail fast & loud.         |
| 6. Smallest scope       | `const` by default, declare at use site, no needless module-level mutable state.                            |
| 7. Check returns/params | Handle every `Promise` rejection & error union; validate inputs at trust boundaries; no swallowed errors.   |
| 8. Limited preprocessor | _N/A._ Analog: limit codegen/decorator/metaprogramming magic that obscures control flow.                    |
| 9. Restricted pointers  | _N/A._ Analog: do not use deep mutable aliasing. Use immutable data and shallow structures.                 |
| 10. Compile clean       | `tsc --noEmit` + ESLint with **zero warnings** as a hard CI gate.                                           |

Rules 3, 8, 9 are C-memory-model artifacts — keep their _spirit_ (bound resource growth, avoid
obscuring magic, avoid tangled aliasing), don't force a literal port.

---

## Rule admission tests

A rule is normative FlightCode — belongs in the curated block of
`configs.recommended` — only if it passes all three:

1. **Traces to a pillar.** It advances strict-mode (Pillar 1), documentation
   (Pillar 2), or Power-of-10 analyzability (Pillar 3). A rule that traces to
   none of the three has no business being normative here.
2. **Catches what it appears to catch.** The failure mode its name implies is
   actually inside its detection set — not merely adjacent to it.
3. **Its violations are defects, not conformance.** If the dominant violation
   class in real code is correct-by-construction — code that is _right_ for
   its own reasons, not broken — the rule is mis-specified for this codebase
   family, whatever its name promises.

**Worked example — `@typescript-eslint/require-await` fails (2) and (3).** It
fires only when a function has zero `await` expressions in its body, so it
structurally cannot flag a forgotten `await` in a function that awaits
_something else_ — that gap is exactly what `no-floating-promises` (Tier 1)
already covers, so `require-await` adds no detection `no-floating-promises`
doesn't already provide (fails test 2). And in practice its dominant hit is
an interface-conforming test double or stub whose `Promise` return type is
load-bearing (it must satisfy an async interface) even though the body never
awaits anything — in highland, 93% of its 1,882 hits were exactly this shape
(fails test 3). See "Rule tiers" below for the disposition.

---

## Rule tiers

`tseslint.configs.recommendedTypeChecked` is a starting point, not policy —
that one spread in `src/recommended.ts` brings in 73 rules at once. Only the
rules **named explicitly** in the curated block below it are normative
FlightCode; everything else arrived along for the ride. Three tiers:

| Tier              | Meaning                                                                                         | Changing it                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **1 — Normative** | Named explicitly in the curated block; traces to a pillar (passes all 3 admission tests).       | Standard decision + version bump.                                                    |
| **2 — Inherited** | Arrives via `recommendedTypeChecked`; on by default, never individually reviewed.               | A repo may disable it with a logged waiver — this is **not** a FlightCode deviation. |
| **3 — Rejected**  | Explicitly set to `"off"` in `configs.recommended`, with the rejection reason recorded in-line. | Standard decision + version bump.                                                    |

This retroactively legitimises existing per-repo disables of _inherited_
(Tier 2) rules: those were never deviations from the standard, because the
standard never claimed those 73 rules as its own in the first place. A
Tier-2 disable still needs a waiver-registry entry (below) — it's just not a
FlightCode violation.

---

## Exemption hierarchy

When code needs a carve-out from a normative rule, prefer options in this
order — each step down is a bigger, longer-lived exemption and should be
harder to reach for:

1. **Fix the code.** No exemption. Always tried first.
2. **Syntactic** — a rule option, or a custom rule keyed on code _shape_
   (e.g. `flightcode/no-bare-json-parse`'s own detection logic).
3. **File-type** — keyed on what the file _is_ (e.g. a `*.cli.ts` glob
   override), written as a plain flat-config block (see
   "`relaxZones()` is path-zone-only" below — it deliberately does not go
   through the helper).
4. **Path zone** — keyed on where the file _lives_, via `relaxZones()`.
   Last resort; must carry a named retirement trigger — the condition under
   which the zone is revisited and, ideally, removed. **A path zone must be
   an explicit file list — no wildcards at all — and this is enforced, not
   just documented.** `relaxZones()` throws at config-load time on any entry
   that isn't a literal path (any entry containing a glob metacharacter:
   `*`, `?`, `[`, `]`, `{`, `}`, `!`). This is deliberately stricter than
   "no recursive glob": even a non-recursive glob like `demo/*.ts` still
   lets a new `.ts` file dropped straight into `demo/` enter the relaxed
   zone with zero `eslint.config.js` diff — the zone would grow without
   anyone deciding it should, and new code would be born non-compliant by
   default. Listing every file explicitly is what actually delivers the
   guarantee: **adding a new file to a relaxed area is a deliberate act that
   shows up in a diff**, because the new file's path has to be typed into
   the list. There is no opt-out flag by design: a consumer who genuinely
   needs a glob-shaped relaxation can hand-write a flat-config block
   directly and own that decision explicitly, rather than routing it through
   the helper that exists specifically to prevent it. (This pairs with the
   retirement-trigger requirement above; together they are what stops a
   path zone from becoming permanent.)

    > **`relaxZones()` is path-zone-only.** It exists to guard tier 4
    > specifically — carve-outs keyed on _where a file lives_. Tier 3
    > file-type deviations (e.g. `**/*.cli.ts` and similar "every file of
    > this kind" globs) are written as a plain flat-config block instead and
    > deliberately do **not** route through `relaxZones()`. Why: a file-type
    > glob selects a _kind_ of file wherever it lives in the tree — it does
    > not attach special treatment to a directory, so it isn't the thing this
    > guard protects against. Passing a file-type glob into `relaxZones()`
    > will throw (same as any other non-literal entry) — that's a signal to
    > move it to a plain block, not a bug to work around.

    > **Limitation, stated honestly.** The enforcement lives in the
    > `relaxZones()` helper only. A consumer can still hand-write a
    > flat-config block with a wildcard `files` glob and bypass it entirely
    > — nothing in this package stops that. The helper makes the easy path
    > the correct path; it is not a hard guarantee against a determined
    > bypass.

5. **Per-site justified disable** — an inline `eslint-disable` with a `--
reason`, counted against the single-digit budget.

> **Guard.** A path zone may never be introduced _to make a gate green_ — that
> is the p-hacking anti-pattern applied to configuration instead of code.
> Reach for step 4 because the exemption is genuinely structural, never
> because it's the fastest way past CI.

---

## Waiver-registry contract

Each adopting repo keeps its own `docs/FLIGHTCODE_WAIVERS.md`. Every entry
must carry, at minimum:

- **The rule** being waived (its full ESLint id).
- **The specific sites** — files/globs/line ranges, not "some places".
- **The rationale** — why this site's violation is conformance, not defect.
- **A retirement trigger** — the condition under which the waiver is
  revisited (e.g. "when the SDK ships typed responses", "when highland's
  test-double count under 200").

Budget stays single-digit per repo, same as the inline-disable budget —
a waiver registry is not a way to launder an unbounded exemption list.

---

## The payoff (why Sam wants this)

- **Documentation** — every function/file carries an enforced, structured contract; readers never
  reverse-engineer intent from the body.
- **Readability** — short lines, short single-purpose functions, minimal scope, no clever control flow.
- **Verifiability** — bounded loops + assertions + validated inputs + strict types mean correctness
  is checkable by review _and_ by tooling, not just by running it.
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
- G. J. Holzmann, "The Power of 10: Rules for Developing Safety-Critical Code," _IEEE Computer_, 2006 (NASA/JPL).
