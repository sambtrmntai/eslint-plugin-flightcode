// src/recommended.ts
//
// The canonical FlightCode ruleset, extracted verbatim (rules + plugins only)
// from littleoak-cherry's `eslint.config.js` (the 10/3/4/60/80 house
// standard). This module owns ONLY the rule/plugin contract — it deliberately
// does NOT bake in any repo-specific `languageOptions` (parserOptions,
// tsconfigRootDir, projectService) or `ignores`. Consumers supply those in
// their own `eslint.config.js` because they are inherently repo-local (see
// README "Consumer setup").
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import eslintComments from "eslint-plugin-eslint-comments";
import type { Linter } from "eslint";
import { rules as flightcodeRules } from "./rules/index.js";

/**
 * The strict canonical FlightCode flat-config array.
 *
 * Spread this into a consumer's `eslint.config.js`, then supply your own
 * `languageOptions` (parserOptions.projectService, tsconfigRootDir) and
 * `ignores` block, since those are repo-specific and out of scope for a
 * shared package. See README.md for the full consumer-setup recipe.
 */
export const recommended: Linter.Config[] = [
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ["**/*.ts", "**/*.tsx"],
        // eslint-plugin-jsdoc and eslint-plugin-eslint-comments ship no type
        // declarations, so their default exports resolve to `any`; and
        // typescript-eslint's `RuleModule` isn't structurally identical to
        // eslint core's `Linter.Plugin` rule shape (different `RuleContext`
        // generics), so the flightcode entry needs a bridging cast.
        /* eslint-disable @typescript-eslint/no-unsafe-assignment -- untyped plugin packages resolve to `any`; flightcode rules bridge typescript-eslint RuleModule to eslint core Linter.Plugin shape */
        plugins: {
            jsdoc,
            "eslint-comments": eslintComments,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridges typescript-eslint RuleModule to eslint core Linter.Plugin shape
            flightcode: { rules: flightcodeRules } as any,
        },
        /* eslint-enable @typescript-eslint/no-unsafe-assignment -- end of untyped-plugin bridge block */
        rules: {
            // ── Power-of-10 / trust-boundary rules (CI-blocking) ──────────────
            "flightcode/bounded-loop-requires-cap": "error",
            // Shipped at "error" on product code. An FP scan against highland
            // found ~0% FP in non-test files (22 real unguarded parses of
            // untrusted input) — the only FP mass (45 sites) was in *.test.ts
            // parsing strings the test itself produced, which is NOT a runtime
            // trust boundary. Those are carved out in the test block below, so
            // this ships as an honest "error" on production code.
            "flightcode/no-bare-json-parse": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "error",
            "no-fallthrough": "off",
            "default-case-last": "error",

            // ── Shape/complexity caps (CI-blocking) ───────────────────────────
            "max-lines-per-function": [
                "error",
                { max: 60, skipBlankLines: true, skipComments: true },
            ],
            "max-depth": ["error", 3],
            "max-params": ["error", 4],
            complexity: ["error", 10],
            "no-nested-ternary": "error",

            // ── Prologue enforcement (CI-blocking, gate scope) ────────────────
            "jsdoc/require-jsdoc": [
                "error",
                {
                    publicOnly: true,
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                        ClassDeclaration: true,
                    },
                },
            ],
            "jsdoc/require-param": "error",
            "jsdoc/require-param-description": "error",
            "jsdoc/require-returns": "error",
            "jsdoc/require-returns-description": "error",

            // ── Deviation protocol: eslint-disable must be justified ──────────
            "eslint-comments/require-description": ["error", { ignore: [] }],
            "eslint-comments/no-unused-disable": "error",
        },
    },
    {
        // Test files: relax the length/complexity caps (fixtures/setup blocks
        // legitimately run long) but keep the trust-boundary + deviation rules.
        files: ["tests/**/*.ts", "**/*.test.ts"],
        rules: {
            "max-lines-per-function": "off",
            "jsdoc/require-jsdoc": "off",
            // Carve-out: JSON.parse in a test typically parses a string the
            // test itself produced (round-trip assertions) — not the runtime
            // untrusted-input boundary the rule guards. Not a hazard here.
            "flightcode/no-bare-json-parse": "off",
        },
    },
];
