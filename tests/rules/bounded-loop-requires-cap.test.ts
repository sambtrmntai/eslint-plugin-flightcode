// tests/rules/bounded-loop-requires-cap.test.ts
//
// RuleTester matrix for `bounded-loop-requires-cap`: valid cases cover the
// bounded forms (normal for, for-of over an array, each flagged form WITH a
// counter-cap guard, and each flagged form WITH a wall-clock deadline-poll
// guard); invalid cases cover each flagged form with no guard. `for await`
// is not a flagged form in v1 (see docs/rules/bounded-loop-requires-cap.md).
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { boundedLoopRequiresCap } from "../../src/rules/bounded-loop-requires-cap.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("bounded-loop-requires-cap", boundedLoopRequiresCap, {
    valid: [
        "for (let i = 0; i < 10; i++) { doThing(); }",
        "for (const x of items) { doThing(x); }",
        `
        while (true) {
            if (++count > 1000) break;
            doThing();
        }
        `,
        `
        for (;;) {
            if (Date.now() >= deadline) break;
            pollOnce();
        }
        `,
        `
        while (true) {
            if (performance.now() - start > TIMEOUT_MS) {
                throw new Error("deadline exceeded");
            }
            pollOnce();
        }
        `,
        `
        async function poll() {
            for (;;) {
                if (Date.now() >= deadline) return false;
                await pollOnce();
            }
        }
        `,
    ],
    invalid: [
        {
            code: "while (true) { doThing(); }",
            errors: [{ messageId: "unboundedLoop" }],
        },
        {
            code: "while (1) { doThing(); }",
            errors: [{ messageId: "unboundedLoop" }],
        },
        {
            code: "for (;;) { doThing(); }",
            errors: [{ messageId: "unboundedLoop" }],
        },
        {
            code: "do { doThing(); } while (true);",
            errors: [{ messageId: "unboundedLoop" }],
        },
    ],
});
