// src/relax-zones.ts
//
// Small, pure helper for building a flat-config override block that relaxes
// specific rules over a set of globs (e.g. demo/website/scripts/tests/mocks
// zones that aren't yet burned down to the canonical ruleset).
import type { Linter } from "eslint";

/**
 * Build a flat-config override block that relaxes the given rules over the
 * given file globs. Spread this AFTER `...configs.recommended` in a
 * consumer's `eslint.config.js` to carve out a relaxed zone — it never
 * mutates `configs.recommended` itself and has no side effects.
 *
 * @param globs - File glob patterns the override applies to.
 * @param ruleOverrides - Rule entries to apply over those globs (e.g.
 *   `{ "no-console": "off" }`).
 * @returns A single flat-config override block.
 */
export function relaxZones(
    globs: string[],
    ruleOverrides: Linter.RulesRecord,
): Linter.Config {
    return { files: globs, rules: ruleOverrides };
}
