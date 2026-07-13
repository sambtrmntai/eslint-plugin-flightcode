import type { Linter } from "eslint";
/**
 * The strict canonical FlightCode flat-config array.
 *
 * Spread this into a consumer's `eslint.config.js`, then supply your own
 * `languageOptions` (parserOptions.projectService, tsconfigRootDir) and
 * `ignores` block, since those are repo-specific and out of scope for a
 * shared package. See README.md for the full consumer-setup recipe.
 */
export declare const recommended: Linter.Config[];
