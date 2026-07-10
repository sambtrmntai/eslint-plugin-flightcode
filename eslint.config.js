// eslint.config.js
//
// This package dogfoods its own `configs.recommended` (D.o.D requirement: the
// canonical config must pass on the package that ships it). This is all
// plain JS, so — matching the "repo supplies its own languageOptions"
// contract documented in README.md — this file wires the type-checked
// rules' project info via the package's own tsconfig.json. This file
// itself is excluded (it sits outside the tsconfig `include` set, same as
// littleoak's own config does for its `eslint.config.js`).
import { configs } from "./index.js";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "eslint.config.js",
      // Ambient type-shim, not part of the tsconfig `include` set.
      "lib/eslint-comments-shim.d.ts",
    ],
  },
  ...configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
