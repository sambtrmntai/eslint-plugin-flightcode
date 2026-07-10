# `flightcode/bounded-loop-requires-cap`

Power-of-10 Rule 2 (bounded loops). Requires an explicit numeric iteration
cap on loop forms that are **unbounded by construction** — not on ordinary
counted or collection loops, which are already provably bounded by their
own syntax.

## What it flags

Exactly these four forms, and only when the loop body has no counter-cap
guard (see below):

1. `while (true)` / `while (1)` — a `while` whose test is a truthy constant.
2. `do { … } while (true)` — same, for `do-while`.
3. `for (;;)` — a `ForStatement` with no `test` clause.
4. `for await (const x of y)` — a `ForOfStatement` with `await: true`
   (async iteration, typically an API pager).

## What it does NOT flag

Deliberately left alone (v1 is conservative, tuned for a near-zero false
positive rate):

- `for (let i = 0; i < n; i++)` — has a test, bounded by construction.
- `for (const x of arr)` / `for (const k in obj)` — non-`await` iteration
  over a finite collection.
- `while (cond)` where `cond` is anything other than a literal truthy
  constant — too ambiguous to judge without type/data-flow info, so it's
  out of scope for v1 rather than risk a false positive.

## Satisfying the rule — the counter-cap guard

A flagged loop is **not** reported if its body contains, as a top-level
statement, an `if` whose test is a comparison (`>`, `>=`, `<`, `<=`) against
a numeric bound — either a numeric literal or an identifier resolving to a
`const` numeric binding — and whose consequent `break`s or `throw`s:

```ts
// Satisfied: numeric literal cap
while (true) {
    if (++count > 1000) break;
    doWork();
}

// Satisfied: const-bound numeric cap
const MAX_PAGES = 500;
for await (const page of pager) {
    if (pageCount >= MAX_PAGES) throw new Error("too many pages");
    pageCount++;
}
```

```ts
// Flagged: no cap guard at all
while (true) {
    doWork();
}

// Flagged: for(;;) with no cap guard
for (;;) {
    doWork();
}
```

Detection is intentionally syntactic and shallow (top-level `if` statements
of the loop body only) — the bias is toward treating an ambiguous or
non-standard guard shape as satisfied (false negative) rather than flagging
it (false positive), per the FlightCode p-hacking guardrail: a brittle rule
at `error` generates justified-disables that erode the waiver budget, which
is worse than an occasional missed unbounded loop.

## Rationale

JPL Power-of-10 Rule 2: all loops must have a fixed upper bound, provable by
a bounds check. Stock eslint has no way to express "this specific loop form
is unbounded" — that requires AST-shape reasoning, which is what this
custom rule adds on top of the stock ruleset.
