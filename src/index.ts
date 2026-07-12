// src/index.ts
//
// Public entry point for @btrmnt/eslint-plugin-flightcode. Exposes the
// canonical `configs.recommended` flat-config array, the `relaxZones()`
// helper, and this plugin's own custom rules (registered under the
// `flightcode` plugin key inside `configs.recommended`). See README.md for
// the consumer-setup contract and gate recipes.
import type { Linter } from "eslint";
import { recommended } from "./recommended.js";
import { relaxZones } from "./relax-zones.js";
import { rules } from "./rules/index.js";

/**
 * Named configs bundle, matching the conventional eslint-plugin shape
 * (`plugin.configs.recommended`).
 */
export const configs: { recommended: Linter.Config[] } = { recommended };

export { relaxZones, rules };
