// eslint.config.js
//
// This package dogfoods its own `configs.recommended` (D.o.D requirement: the
// canonical config must pass on the package that ships it). Because the
// source is now authored in TypeScript, `configs.recommended`'s `.ts`-scoped
// cap rules actually attach here — this is the fix for the earlier vacuous
// JS dogfood. Matching the "repo supplies its own languageOptions" contract
// documented in README.md, this file wires the type-checked rules' project
// info via the package's own tsconfig. This file itself is excluded (it sits
// outside the tsconfig `include` set, same as littleoak's own config does
// for its `eslint.config.js`).
//
// NOTE: this imports the built `dist/index.js` (plain node ESM can't load
// `.ts` directly), so `npm run build` must run before `npm run lint`.
import { configs } from "./dist/index.js";

export default [
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
            "eslint.config.js",
        ],
    },
    ...configs.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.typecheck.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
];
