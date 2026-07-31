// src/relax-zones.ts
//
// Small, pure helper for building a flat-config override block that relaxes
// specific rules over a set of literal files (e.g. specific demo/scripts
// files that aren't yet burned down to the canonical ruleset). Enforces the
// FlightCode.md "Exemption hierarchy" tier-4 rule: a path zone must be an
// explicit file list, since any glob (even a non-recursive one) lets a new
// file enter the relaxed zone without showing up in a diff.
import type { Linter } from "eslint";

const GLOB_METACHARACTERS = ["*", "?", "[", "]", "{", "}", "!"];

/**
 * Check whether a single path-zone entry is a valid literal file path — a
 * string containing none of the glob metacharacters.
 *
 * @param entry - The candidate path-zone entry.
 * @returns True if `entry` is a literal path; false otherwise.
 */
function isLiteralPath(entry: unknown): entry is string {
    if (typeof entry !== "string") {
        return false;
    }
    for (const metachar of GLOB_METACHARACTERS) {
        if (entry.includes(metachar)) {
            return false;
        }
    }
    return true;
}

/**
 * Format a single offending entry for the error message, quoting strings
 * and describing non-string entries by their JSON representation.
 *
 * @param entry - The offending path-zone entry.
 * @returns A human-readable, quoted representation of `entry`.
 */
function describeOffender(entry: unknown): string {
    return typeof entry === "string" ? `"${entry}"` : JSON.stringify(entry);
}

/**
 * Find every entry in `paths` that is not a literal file path.
 *
 * @param paths - The candidate path-zone entries to check.
 * @returns The subset of `paths` that fail the literal-path check, in
 *   order, each already formatted for display.
 */
function findNonLiteralPaths(paths: unknown[]): string[] {
    const offenders: string[] = [];
    for (const entry of paths) {
        if (!isLiteralPath(entry)) {
            offenders.push(describeOffender(entry));
        }
    }
    return offenders;
}

/**
 * Build the actionable error message for one or more non-literal-path
 * offenders, naming each and stating the fix.
 *
 * @param offenders - The offending entries, already formatted for display.
 * @returns The full error message text.
 */
function buildNonLiteralPathErrorMessage(offenders: string[]): string {
    const quoted = offenders.join(", ");
    const many = offenders.length > 1;
    const subject = many ? "are not literal paths" : "is not a literal path";
    return (
        `relaxZones: ${quoted} ${subject} — a path zone ` +
        `must be an explicit file list so a new file cannot enter it ` +
        `without showing up in a diff. List each file explicitly. For a ` +
        `file-TYPE exemption (e.g. all *.cli.ts), use a plain flat-config ` +
        `block instead — see FLIGHTCODE.md "Exemption hierarchy".`
    );
}

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
export function relaxZones(
    files: string[],
    ruleOverrides: Linter.RulesRecord,
): Linter.Config {
    const offenders = findNonLiteralPaths(files);
    if (offenders.length > 0) {
        throw new Error(buildNonLiteralPathErrorMessage(offenders));
    }
    return { files, rules: ruleOverrides };
}
