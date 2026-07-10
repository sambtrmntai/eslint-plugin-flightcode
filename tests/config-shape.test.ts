// tests/config-shape.test.ts
//
// Asserts `configs.recommended` carries the canonical FlightCode caps and
// that `relaxZones()` behaves as a pure helper. No custom AST rules exist
// yet (Phase 2b), so these tests assert config/helper shape only.
import { describe, expect, it } from "vitest";
import type { Linter } from "eslint";
import { configs, relaxZones } from "../src/index.js";

/**
 * Find the flat-config block within `configs.recommended` that declares the
 * given rule, searching every block's `rules` object.
 *
 * @param configArray - The flat-config array to search.
 * @param ruleName - The rule id to look for (e.g. "max-depth").
 * @returns The rule's configured value, or `undefined` if absent.
 */
function findRuleValue(
    configArray: Linter.Config[],
    ruleName: string,
): unknown {
    for (const block of configArray) {
        if (block.rules && ruleName in block.rules) {
            return block.rules[ruleName];
        }
    }
    return undefined;
}

describe("configs.recommended", () => {
    it("is exported as a flat-config array", () => {
        expect(Array.isArray(configs.recommended)).toBe(true);
        expect(configs.recommended.length).toBeGreaterThan(0);
    });

    it("carries the canonical shape/complexity caps", () => {
        expect(findRuleValue(configs.recommended, "complexity")).toEqual([
            "error",
            10,
        ]);
        expect(findRuleValue(configs.recommended, "max-depth")).toEqual([
            "error",
            3,
        ]);
        expect(findRuleValue(configs.recommended, "max-params")).toEqual([
            "error",
            4,
        ]);
        expect(
            findRuleValue(configs.recommended, "max-lines-per-function"),
        ).toEqual([
            "error",
            { max: 60, skipBlankLines: true, skipComments: true },
        ]);
    });

    it("carries the trust-boundary rules at error level", () => {
        expect(
            findRuleValue(
                configs.recommended,
                "@typescript-eslint/no-floating-promises",
            ),
        ).toBe("error");
        expect(
            findRuleValue(
                configs.recommended,
                "@typescript-eslint/no-explicit-any",
            ),
        ).toBe("error");
        expect(
            findRuleValue(
                configs.recommended,
                "@typescript-eslint/no-unused-vars",
            ),
        ).toBe("error");
        expect(findRuleValue(configs.recommended, "no-nested-ternary")).toBe(
            "error",
        );
    });

    it("carries the jsdoc prologue rules", () => {
        expect(
            findRuleValue(configs.recommended, "jsdoc/require-jsdoc"),
        ).toEqual([
            "error",
            {
                publicOnly: true,
                require: {
                    FunctionDeclaration: true,
                    MethodDefinition: true,
                    ClassDeclaration: true,
                },
            },
        ]);
    });

    it("carries the eslint-comments deviation rules", () => {
        expect(
            findRuleValue(
                configs.recommended,
                "eslint-comments/require-description",
            ),
        ).toEqual(["error", { ignore: [] }]);
        expect(
            findRuleValue(
                configs.recommended,
                "eslint-comments/no-unused-disable",
            ),
        ).toBe("error");
    });

    it("relaxes max-lines-per-function and require-jsdoc for test files", () => {
        const testBlock = configs.recommended.find(
            (block) =>
                Array.isArray(block.files) &&
                block.files.includes("**/*.test.ts"),
        );
        expect(testBlock).toBeDefined();
        expect(testBlock?.rules?.["max-lines-per-function"]).toBe("off");
        expect(testBlock?.rules?.["jsdoc/require-jsdoc"]).toBe("off");
    });

    it("does not bake repo-specific languageOptions into the custom rules block", () => {
        const rulesBlock = configs.recommended.find(
            (block) => block.plugins && "jsdoc" in block.plugins,
        );
        expect(rulesBlock).toBeDefined();
        expect(rulesBlock?.languageOptions).toBeUndefined();
    });
});

describe("relaxZones()", () => {
    it("returns a single override block with the given globs and rules", () => {
        expect(relaxZones(["demo/**"], { "no-console": "off" })).toEqual({
            files: ["demo/**"],
            rules: { "no-console": "off" },
        });
    });

    it("is pure — same inputs produce equal (not identical) output", () => {
        const globs = ["scripts/**"];
        const rules: Linter.RulesRecord = { "no-console": "warn" };
        const first = relaxZones(globs, rules);
        const second = relaxZones(globs, rules);
        expect(first).toEqual(second);
        expect(first).not.toBe(second);
    });
});
