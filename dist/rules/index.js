import { boundedLoopRequiresCap } from "./bounded-loop-requires-cap.js";
import { noBareJsonParse } from "./no-bare-json-parse.js";
/**
 * The plugin's own custom rules, keyed by their unprefixed rule id.
 */
export const rules = {
    "bounded-loop-requires-cap": boundedLoopRequiresCap,
    "no-bare-json-parse": noBareJsonParse,
};
