# `flightcode/bounded-loop-requires-cap`

Power-of-10 Rule 2 (bounded loops). Requires an explicit numeric iteration
cap on loop forms that are **unbounded by construction** — not on ordinary
counted or collection loops, which are already provably bounded by their
own syntax.

**Binds.** Every `.ts` / `.tsx` file in a repo whose eslint config extends
`configs.recommended`. **Exception:** none — the rule has no test-only
carve-out, unlike `no-bare-json-parse`.

## What it flags

Exactly these three forms, and only when the loop body has no cap guard
(see below):

1. `while (true)` / `while (1)` — a `while` whose test is a truthy constant.
2. `do { … } while (true)` — same, for `do-while`.
3. `for (;;)` — a `ForStatement` with no `test` clause.

`for await (const x of y)` (async iteration, typically an API pager) is
**not** a flagged form in v1 — see "Deferred: `for await`" below.

## What it does NOT flag

Deliberately left alone (v1 is conservative, tuned for a near-zero false
positive rate):

- `for (let i = 0; i < n; i++)` — has a test, bounded by construction.
- `for (const x of arr)` / `for (const k in obj)` — non-`await` iteration
  over a finite collection.
- `for await (const x of y)` — deferred, see below.
- `while (cond)` where `cond` is anything other than a literal truthy
  constant — too ambiguous to judge without type/data-flow info, so it's
  out of scope for v1 rather than risk a false positive.

## Satisfying the rule — cap guards

A flagged loop is **not** reported if its body contains, as a top-level
statement, an `if` whose test is one of two recognized cap-guard shapes and
whose consequent `break`s or `throw`s:

### Counter-cap guard

A comparison (`>`, `>=`, `<`, `<=`) against a numeric bound — either a
numeric literal or an identifier resolving to a `const` numeric binding:

```ts
// Satisfied: numeric literal cap
while (true) {
    if (++count > 1000) break;
    doWork();
}

// Satisfied: const-bound numeric cap
const MAX_PAGES = 500;
while (true) {
    if (pageCount >= MAX_PAGES) throw new Error("too many pages");
    pageCount++;
}
```

### Wall-clock deadline-poll guard

A comparison (`>`, `>=`, `<`, `<=`) where either side is a call to
`Date.now()` or `performance.now()` (directly, or as one side of an
elapsed-time subtraction like `performance.now() - start`) — a timeout IS a
cap. The consequent may `break`, `throw`, **or `return`** (a `return` from
the enclosing function exits the loop just as unconditionally as a `break`):

```ts
// Satisfied: deadline-poll cap, break
for (;;) {
    if (Date.now() >= deadline) break;
    pollOnce();
}

// Satisfied: elapsed-time deadline-poll cap, throw
while (true) {
    if (performance.now() - start > TIMEOUT_MS) {
        throw new Error("deadline exceeded");
    }
    pollOnce();
}

// Satisfied: deadline-poll cap, return
async function poll() {
    for (;;) {
        if (Date.now() >= deadline) return false;
        await pollOnce();
    }
}
```

### Not satisfied

```ts
// Flagged: no cap guard at all
while (true) {
    doWork();
}

// Flagged: for(;;) with no cap guard
for (;;) {
    doWork();
}

// Flagged: driver-flag-only for(;;), no numeric or time bound
for (;;) {
    const r = await iterator.next();
    if (r.done) break;
    handle(r.value);
}
```

Detection is intentionally syntactic and shallow — top-level `if` statements
of the loop body only. The bias is toward treating an ambiguous or
non-standard guard shape as satisfied (a false negative) rather than flagging
it (a false positive).

> **Why that direction.** Per the FlightCode p-hacking guardrail, a brittle
> rule at `error` generates justified-disables that erode the waiver budget.
> That is worse than an occasional missed unbounded loop.

## Deferred: `for await`

`for await (const x of y)` was flagged in an earlier iteration of this rule
but has been dropped for v1: a syntactic rule can't distinguish a bounded
stream (e.g. iterating stdin to EOF) from an unbounded pager without type
information, which is too false-positive-prone for a rule wired at `error`.
Pager-boundedness is deferred to a **future typed rule** (same bucket as
`no-unguarded-db-write`) that can use type information to tell a bounded
async iterable from an unbounded one.

## Rationale

JPL Power-of-10 Rule 2: all loops must have a fixed upper bound, provable by
a bounds check. Stock eslint has no way to express "this specific loop form
is unbounded" — that requires AST-shape reasoning, which is what this
custom rule adds on top of the stock ruleset.
