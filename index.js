// index.js
//
// Public entry point for @btrmnt/eslint-plugin-flightcode. Exposes the
// canonical `configs.recommended` flat-config array and the `relaxZones()`
// helper. See README.md for the consumer-setup contract and gate recipes.
import { recommended } from "./lib/recommended.js";
import { relaxZones } from "./lib/relax-zones.js";

/**
 * Named configs bundle, matching the conventional eslint-plugin shape
 * (`plugin.configs.recommended`).
 *
 * @type {{ recommended: import("eslint").Linter.Config[] }}
 */
export const configs = { recommended };

export { relaxZones };
