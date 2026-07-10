// lib/relax-zones.js
//
// Small, pure helper for building a flat-config override block that relaxes
// specific rules over a set of globs (e.g. demo/website/scripts/tests/mocks
// zones that aren't yet burned down to the canonical ruleset).

/**
 * Build a flat-config override block that relaxes the given rules over the
 * given file globs. Spread this AFTER `...configs.recommended` in a
 * consumer's `eslint.config.js` to carve out a relaxed zone — it never
 * mutates `configs.recommended` itself and has no side effects.
 *
 * @param {string[]} globs - File glob patterns the override applies to.
 * @param {Record<string, unknown>} ruleOverrides - Rule entries to apply
 *   over those globs (e.g. `{ "no-console": "off" }`).
 * @returns {{ files: string[], rules: Record<string, unknown> }} A single
 *   flat-config override block.
 */
export function relaxZones(globs, ruleOverrides) {
  return { files: globs, rules: ruleOverrides };
}
