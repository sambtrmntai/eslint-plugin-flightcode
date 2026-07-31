// tests/config-shape.test.ts
//
// Asserts `configs.recommended` carries the canonical FlightCode caps and
// that `relaxZones()` behaves as a pure helper. No custom AST rules exist
// yet (Phase 2b), so these tests assert config/helper shape only.
import { describe, expect, it } from "vitest";
import type { Linter } from "eslint";
import { configs, relaxZones } from "../src/index.js";

/**
 * Detect whether a flat-config block is scoped to test files, without
 * relying on an exact-string match against one specific glob spelling. A
 * block counts as test-scoped if it declares a `files` array and every
 * entry in it mentions "test" (case-insensitively) — covering spellings
 * like `tests/**`, `**\/*.test.ts`, `**\/__tests__/**`, etc. A future
 * rename of the test-relax block's glob still gets caught by this, instead
 * of silently falling through to a wrong "effective value" result.
 *
 * @param block - The flat-config block to inspect.
 * @returns True if every `files` entry looks test-scoped; false otherwise
 *   (including when `files` is absent, since that block applies broadly).
 */
function isTestScopedBlock(block: Linter.Config): boolean {
    if (!Array.isArray(block.files) || block.files.length === 0) {
        return false;
    }
    return block.files.every(
        (glob) => typeof glob === "string" && /test/i.test(glob),
    );
}

/**
 * Find the effective value of a rule for production (non-test) files in
 * `configs.recommended`, mirroring ESLint flat-config layering: later
 * blocks override earlier ones. Walks the array from the END, skipping any
 * test-scoped relax block (see `isTestScopedBlock`), so a rule the preset
 * sets one way and the curated block overrides is resolved to the curated
 * (later, more specific) value rather than the test-file relax value.
 *
 * @param configArray - The flat-config array to search.
 * @param ruleName - The rule id to look for (e.g. "max-depth").
 * @returns The rule's effective configured value, or `undefined` if absent.
 */
function findRuleValue(
    configArray: Linter.Config[],
    ruleName: string,
): unknown {
    for (let i = configArray.length - 1; i >= 0; i -= 1) {
        const block = configArray[i];
        if (isTestScopedBlock(block)) {
            continue;
        }
        if (block.rules && ruleName in block.rules) {
            return block.rules[ruleName];
        }
    }
    return undefined;
}

/**
 * Assert the canonical shape/complexity caps (complexity, max-depth,
 * max-params, max-lines-per-function) match their FlightCode values.
 *
 * @returns Nothing; throws via `expect` on mismatch.
 */
function assertShapeCaps(): void {
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
    ).toEqual(["error", { max: 60, skipBlankLines: true, skipComments: true }]);
}

/**
 * Assert the long-standing trust-boundary rules are set to "error".
 *
 * @returns Nothing; throws via `expect` on mismatch.
 */
function assertTrustBoundaryRules(): void {
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
        findRuleValue(configs.recommended, "@typescript-eslint/no-unused-vars"),
    ).toBe("error");
    expect(findRuleValue(configs.recommended, "no-nested-ternary")).toBe(
        "error",
    );
}

/**
 * Assert the Tier 1 `no-unsafe-*` trust-boundary rules are all "error".
 *
 * @returns Nothing; throws via `expect` on mismatch.
 */
function assertTier1UnsafeRules(): void {
    const rules = [
        "@typescript-eslint/no-unsafe-assignment",
        "@typescript-eslint/no-unsafe-call",
        "@typescript-eslint/no-unsafe-member-access",
        "@typescript-eslint/no-unsafe-return",
        "@typescript-eslint/no-unsafe-argument",
    ];
    for (const rule of rules) {
        expect(findRuleValue(configs.recommended, rule)).toBe("error");
    }
}

/**
 * Assert the jsdoc prologue-enforcement rules carry their expected options.
 *
 * @returns Nothing; throws via `expect` on mismatch.
 */
function assertJsdocPrologueRules(): void {
    expect(findRuleValue(configs.recommended, "jsdoc/require-jsdoc")).toEqual([
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
}

/**
 * Assert the eslint-comments deviation-protocol rules are set as expected.
 *
 * @returns Nothing; throws via `expect` on mismatch.
 */
function assertDeviationRules(): void {
    expect(
        findRuleValue(
            configs.recommended,
            "eslint-comments/require-description",
        ),
    ).toEqual(["error", { ignore: [] }]);
    expect(
        findRuleValue(configs.recommended, "eslint-comments/no-unused-disable"),
    ).toBe("error");
}

describe("configs.recommended", () => {
    it("is exported as a flat-config array", () => {
        expect(Array.isArray(configs.recommended)).toBe(true);
        expect(configs.recommended.length).toBeGreaterThan(0);
    });

    it("carries the canonical shape/complexity caps", () => {
        assertShapeCaps();
    });

    it("carries the trust-boundary rules at error level", () => {
        assertTrustBoundaryRules();
    });

    it("carries the Tier 1 trust-boundary no-unsafe-* rules at error level", () => {
        assertTier1UnsafeRules();
    });

    it("rejects require-await as Tier 3 (off)", () => {
        expect(
            findRuleValue(
                configs.recommended,
                "@typescript-eslint/require-await",
            ),
        ).toBe("off");
    });

    it("carries the jsdoc prologue rules", () => {
        assertJsdocPrologueRules();
    });

    it("carries the eslint-comments deviation rules", () => {
        assertDeviationRules();
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
    it("returns a single override block for an explicit file list", () => {
        const files = ["demo/a.ts", "demo/b.ts"];
        expect(relaxZones(files, { "no-console": "off" })).toEqual({
            files,
            rules: { "no-console": "off" },
        });
    });

    it("accepts a multi-file explicit list", () => {
        const files = ["scripts/build.ts", "scripts/deploy.ts"];
        expect(relaxZones(files, { "no-console": "off" })).toEqual({
            files,
            rules: { "no-console": "off" },
        });
    });

    it("is pure — same inputs produce equal (not identical) output", () => {
        const files = ["scripts/build.ts"];
        const rules: Linter.RulesRecord = { "no-console": "warn" };
        const first = relaxZones(files, rules);
        const second = relaxZones(files, rules);
        expect(first).toEqual(second);
        expect(first).not.toBe(second);
    });

    it("rejects a non-recursive glob — a glob still swallows new files", () => {
        // Removing the metacharacter check would let this call through,
        // since "demo/*.ts" is not a recursive "**" glob — that is exactly
        // the gap this predicate closes.
        expect(() =>
            relaxZones(["demo/*.ts"], { "no-console": "off" }),
        ).toThrow(
            'relaxZones: "demo/*.ts" is not a literal path — a path zone ' +
                "must be an explicit file list so a new file cannot enter " +
                "it without showing up in a diff. List each file " +
                "explicitly. For a file-TYPE exemption (e.g. all " +
                "*.cli.ts), use a plain flat-config block instead — see " +
                'FLIGHTCODE.md "Exemption hierarchy".',
        );
    });

    it("rejects a recursive glob", () => {
        // Removing the metacharacter check entirely would let this call
        // through; this is the same failure mode the prior "**"-only
        // predicate covered, now subsumed by the literal-path check.
        expect(() => relaxZones(["demo/**"], { "no-console": "off" })).toThrow(
            /"demo\/\*\*" is not a literal path/,
        );
    });

    it("rejects a file-type glob — that belongs in a plain flat-config block", () => {
        expect(() =>
            relaxZones(["**/*.cli.ts"], { "no-console": "off" }),
        ).toThrow(/"\*\*\/\*\.cli\.ts" is not a literal path/);
    });

    it("rejects a non-string entry with the actionable message, not a raw TypeError", () => {
        // Without the isLiteralPath type guard this would throw
        // `TypeError: entry.includes is not a function` instead.
        expect(() =>
            // @ts-expect-error -- deliberately testing runtime rejection of
            // a non-string entry; relaxZones's type signature disallows
            // this at compile time, but a JS consumer isn't type-checked.
            relaxZones([123], { "no-console": "off" }),
        ).toThrow(/123 is not a literal path/);
    });

    it("reports every offender in a mixed array, not just the first", () => {
        expect(() =>
            relaxZones(["demo/**", "scripts/build.ts", "website/**"], {
                "no-console": "off",
            }),
        ).toThrow(/"demo\/\*\*", "website\/\*\*" are not literal paths/);
    });
});
