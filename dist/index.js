import { recommended } from "./recommended.js";
import { relaxZones } from "./relax-zones.js";
import { rules } from "./rules/index.js";
/**
 * Named configs bundle, matching the conventional eslint-plugin shape
 * (`plugin.configs.recommended`).
 */
export const configs = { recommended };
export { relaxZones, rules };
