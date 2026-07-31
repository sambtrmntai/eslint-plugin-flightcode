import type { Linter } from "eslint";
/**
 * Build a flat-config override block that relaxes the given rules over an
 * explicit list of files. Spread this AFTER `...configs.recommended` in a
 * consumer's `eslint.config.js` to carve out a relaxed zone — it never
 * mutates `configs.recommended` itself and has no side effects beyond the
 * validation throw below.
 *
 * @param files - Literal file paths the override applies to. Every entry
 *   must be a plain string with no glob metacharacters (`*`, `?`, `[`, `]`,
 *   `{`, `}`, `!`) — see FLIGHTCODE.md "Exemption hierarchy" for why, and no
 *   opt-out is provided by design. A file-TYPE exemption (e.g. all
 *   `*.cli.ts` files) does not belong here; write it as a plain flat-config
 *   block instead.
 * @param ruleOverrides - Rule entries to apply over those files (e.g.
 *   `{ "no-console": "off" }`).
 * @returns A single flat-config override block.
 * @throws {Error} If any entry in `files` is not a literal file path.
 */
export declare function relaxZones(files: string[], ruleOverrides: Linter.RulesRecord): Linter.Config;
