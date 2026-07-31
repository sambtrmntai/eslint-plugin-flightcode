import type { Linter } from "eslint";
/**
 * Build a flat-config override block that relaxes the given rules over the
 * given file globs. Spread this AFTER `...configs.recommended` in a
 * consumer's `eslint.config.js` to carve out a relaxed zone — it never
 * mutates `configs.recommended` itself and has no side effects beyond the
 * validation throw below.
 *
 * @param globs - File glob patterns the override applies to. None may
 *   contain a recursive (`**`) segment — see FLIGHTCODE.md "Exemption
 *   hierarchy" for why, and no opt-out is provided by design.
 * @param ruleOverrides - Rule entries to apply over those globs (e.g.
 *   `{ "no-console": "off" }`).
 * @returns A single flat-config override block.
 * @throws {Error} If any glob in `globs` contains a recursive `**` segment.
 */
export declare function relaxZones(globs: string[], ruleOverrides: Linter.RulesRecord): Linter.Config;
