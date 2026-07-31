const RECURSIVE_GLOB_SEGMENT = "**";
/**
 * Find every glob in `globs` that contains a recursive (`**`) segment.
 *
 * @param globs - File glob patterns to check.
 * @returns The subset of `globs` containing a recursive segment, in order.
 */
function findRecursiveGlobs(globs) {
    const offenders = [];
    for (const glob of globs) {
        if (glob.includes(RECURSIVE_GLOB_SEGMENT)) {
            offenders.push(glob);
        }
    }
    return offenders;
}
/**
 * Build the actionable error message for one or more recursive-glob
 * offenders, naming each glob and stating the fix.
 *
 * @param offenders - The recursive globs found, in order.
 * @returns The full error message text.
 */
function buildRecursiveGlobErrorMessage(offenders) {
    const quoted = offenders.map((glob) => `"${glob}"`).join(", ");
    const plural = offenders.length > 1 ? "globs" : "glob";
    return (`relaxZones: recursive ${plural} ${quoted} ${offenders.length > 1 ? "are" : "is"} not allowed — a path zone must not silently swallow new files. ` +
        `Use a non-recursive glob ("demo/*.ts") or an explicit file list. ` +
        `See FLIGHTCODE.md "Exemption hierarchy".`);
}
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
export function relaxZones(globs, ruleOverrides) {
    const offenders = findRecursiveGlobs(globs);
    if (offenders.length > 0) {
        throw new Error(buildRecursiveGlobErrorMessage(offenders));
    }
    return { files: globs, rules: ruleOverrides };
}
