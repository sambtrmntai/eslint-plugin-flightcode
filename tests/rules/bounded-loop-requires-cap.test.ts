// tests/rules/bounded-loop-requires-cap.test.ts
//
// RuleTester matrix for `bounded-loop-requires-cap`: valid cases cover the
// bounded forms (normal for, for-of over an array, and each flagged form
// WITH a counter-cap guard); invalid cases cover each flagged form with no
// guard. See docs/rules/bounded-loop-requires-cap.md for the rationale.
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
        const MAX_PAGES = 500;
        for await (const page of pager) {
            if (pageCount >= MAX_PAGES) throw new Error("too many pages");
            pageCount++;
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
        {
            code: `
            for await (const page of pager) {
                doThing(page);
            }
            `,
            errors: [{ messageId: "unboundedLoop" }],
        },
    ],
});
