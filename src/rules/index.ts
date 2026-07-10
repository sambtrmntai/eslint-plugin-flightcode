// src/rules/index.ts
//
// Registry of this plugin's own custom rules, keyed by their unprefixed rule
// id. Imported by both `src/index.ts` (to expose `plugin.rules` for
// consumers who enable rules manually) and `src/recommended.ts` (to register
// the plugin under the `flightcode` key and enable its rules) — kept as its
// own module so those two don't need to import each other.
import type { TSESLint } from "@typescript-eslint/utils";
import { boundedLoopRequiresCap } from "./bounded-loop-requires-cap.js";
import { noBareJsonParse } from "./no-bare-json-parse.js";

/**
 * The plugin's own custom rules, keyed by their unprefixed rule id.
 */
export const rules: Record<string, TSESLint.RuleModule<string, unknown[]>> = {
    "bounded-loop-requires-cap": boundedLoopRequiresCap,
    "no-bare-json-parse": noBareJsonParse,
};
