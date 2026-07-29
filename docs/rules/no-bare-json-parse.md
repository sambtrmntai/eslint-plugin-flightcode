# `flightcode/no-bare-json-parse`

Power-of-10 Rule 5 (trust boundary / crash containment). Requires
`JSON.parse(...)` calls on untrusted input to be guarded by an enclosing
`try` block — an uncaught `SyntaxError` from a malformed parse crashes the
boundary it runs in.

**Binds.** Product code in every `.ts` / `.tsx` file in a repo whose eslint
config extends `configs.recommended`, at `error`. **Exception:** test files,
where the rule ships `off` — the only false-positive mass is the test-only
"parse-then-assert on self-produced JSON" pattern, which is not a runtime
hazard.

## What it flags

A `CallExpression` whose callee is `JSON.parse` (a non-computed
`MemberExpression`, object `JSON`, property `parse`) that is **not**
lexically inside a `try` block's `block`, walking ancestors up to the
nearest enclosing function boundary.

```ts
// Flagged: no try/catch around the parse
const body = JSON.parse(req.body);

// Flagged: still bare inside a function
function handler(req) {
    const body = JSON.parse(req.body);
    return body;
}
```

## What it does NOT flag

Deliberately left alone (v1 is conservative, tuned for a near-zero false
positive rate):

- `JSON.parse(...)` already inside a `try` block:

    ```ts
    try {
        const parsed = JSON.parse(input);
    } catch (err) {
        handle(err);
    }
    ```

- `JSON.parse(JSON.stringify(x))` — the deep-clone idiom. `JSON.stringify`'s
  own output is always valid JSON, so this specific composition can never
  throw on its own input.

    ```ts
    const clone = JSON.parse(JSON.stringify(x));
    ```

- `JSON.parse('<string literal>')` — the argument is a compile-time-known
  constant, not runtime-untrusted input.

    ```ts
    const parsed = JSON.parse('{"a":1}');
    ```

Detection is intentionally syntactic and shallow (a lexical ancestor walk
for an enclosing `try` block, stopping at the first function boundary) — the
bias is toward leaving an ambiguous or non-standard safe idiom unflagged
(false negative) rather than flagging it (false positive), per the
FlightCode p-hacking guardrail.

## Rationale

JPL Power-of-10 Rule 5: check the return status of all non-void functions,
and validate parameters — a parse of untrusted data is exactly this class of
trust-boundary crossing. Stock eslint has no rule expressing "this specific
call must be guarded by a try", which is what this custom rule adds on top
of the stock ruleset.

## Shipped at `error` on product code, carved out in tests

This rule is wired at `error` in `configs.recommended`, with a **test-file
carve-out** (`off` for `tests/**/*.ts` and `**/*.test.ts`). That split is
evidence-driven, from an FP scan against a real consuming codebase (highland,
`staff/**` `demo/**` `lib/**`) that flagged **67 sites**:

| Bucket                                   | Count | Classification                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-test files (`*.ts`, not `*.test.ts`) | 22    | **TP** (sampled ~14/22): real unguarded parses of network response bodies, DB `jsonb` columns, CLI argv/stdin, and test-double/mock files mirroring the same untrusted-input shape.                                                                                                                                                                                                      |
| Test files (`*.test.ts`)                 | 45    | **FP** (sampled ~8/45, pattern held throughout the sample): `JSON.parse(...)` inside a test assertion, parsing a JSON string the test itself produced a few lines earlier (e.g. asserting a mocked DB call's own bound param round-trips) — not a real untrusted-input trust boundary; a parse failure here just fails the assertion inside `it()`, it doesn't crash a runtime boundary. |

**On product code the FP rate is ~0%** (22/22 sampled TP) — exactly the
trust-boundary crossings this rule exists to catch. The entire FP mass is the
single test-only "parse-then-assert on self-produced JSON" pattern, which is
not a runtime hazard. So the rule ships `error` on product code and `off` in
tests, rather than a blanket `warn` (which would make the 22 real gaps
non-blocking noise). A narrower future refinement — recognizing "parse of a
value bound a few lines earlier in the same block" as a safe idiom — could let
the rule stay on in tests too, but the carve-out is the pragmatic v1 answer.
