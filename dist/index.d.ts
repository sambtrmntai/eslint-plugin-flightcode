import type { Linter } from "eslint";
import { relaxZones } from "./relax-zones.js";
import { rules } from "./rules/index.js";
/**
 * Named configs bundle, matching the conventional eslint-plugin shape
 * (`plugin.configs.recommended`).
 */
export declare const configs: {
    recommended: Linter.Config[];
};
export { relaxZones, rules };
