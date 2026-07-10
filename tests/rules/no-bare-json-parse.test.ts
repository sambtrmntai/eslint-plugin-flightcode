// tests/rules/no-bare-json-parse.test.ts
//
// RuleTester matrix for `no-bare-json-parse`: valid cases cover JSON.parse
// guarded by try/catch, the JSON.stringify deep-clone idiom, and parsing a
// string literal; invalid cases cover bare JSON.parse calls on an untrusted
// input outside any try block.
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noBareJsonParse } from "../../src/rules/no-bare-json-parse.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-bare-json-parse", noBareJsonParse, {
    valid: [
        `
        try {
            const parsed = JSON.parse(input);
        } catch (err) {
            handle(err);
        }
        `,
        "const clone = JSON.parse(JSON.stringify(x));",
        `const parsed = JSON.parse('{"a":1}');`,
        `
        function handler(req) {
            try {
                return JSON.parse(req.body);
            } catch (err) {
                return null;
            }
        }
        `,
    ],
    invalid: [
        {
            code: "const parsed = JSON.parse(input);",
            errors: [{ messageId: "bareJsonParse" }],
        },
        {
            code: "const body = JSON.parse(req.body);",
            errors: [{ messageId: "bareJsonParse" }],
        },
        {
            code: `
            function handler(req) {
                const body = JSON.parse(req.body);
                return body;
            }
            `,
            errors: [{ messageId: "bareJsonParse" }],
        },
    ],
});
