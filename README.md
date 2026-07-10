# @btrmnt/eslint-plugin-flightcode

The canonical **FlightCode** eslint flat-config (the 10/3/4/60/80 house
ruleset — see `docs/FLIGHTCODE.md` in `~/base` for the full standard) as a
standalone, installable package. Authored in **TypeScript**, compiled to
`dist/` via `tsc`. Ships:

- `configs.recommended` — the strict canonical flat-config array (rules +
  plugins only, extracted verbatim from littleoak-cherry's proven
  `eslint.config.js`).
- `relaxZones(globs, ruleOverrides)` — a tiny pure helper for carving out
  relaxed zones (demo/website/scripts/tests/mocks) in a consumer repo.

This package does **not** ship any custom AST rules yet (that's a later
phase) and is not yet consumed by any repo — it's a standalone scaffold.

`configs.recommended`'s cap rules are scoped to `**/*.ts`/`**/*.tsx` files —
so this package's own source must be `.ts` for its dogfood gate (below) to
actually mean anything (an earlier `.js` scaffold made this vacuous; fixed
here).

## Consumer setup — the contract

`configs.recommended` carries **rules + plugins only**. It deliberately does
**not** bake in any repo-specific `languageOptions` (parserOptions,
`tsconfigRootDir`, `projectService`) or `ignores` — those are inherently
repo-local, so every consumer must supply its own in `eslint.config.js`:

```js
// consumer's eslint.config.js
import tseslint from "typescript-eslint";
import { configs, relaxZones } from "@btrmnt/eslint-plugin-flightcode";

export default tseslint.config(
    {
        ignores: ["node_modules/**", "dist/**", "eslint.config.js"],
    },
    ...configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    // Relax specific zones AFTER configs.recommended:
    relaxZones(["demo/**", "website/**"], {
        "@typescript-eslint/no-explicit-any": "off",
    }),
);
```

Peer deps you must have installed: `eslint@^9.39.4`,
`typescript-eslint@^8.62.1`.

## Gate recipe 1 — full-tree `check:flightcode` (CI-blocking)

Wire this as your own repo's `check:flightcode` script. It runs
`configs.recommended` plus your `relaxZones(...)` block, where relaxed zones
are `off` for the rules you haven't burned down yet (no bulk retrofit
required), **plus** Prettier's 80-col width check (eslint does not enforce
column width — Prettier owns that):

```json
{
    "scripts": {
        "check:flightcode": "eslint . --max-warnings 0 && prettier --check ."
    }
}
```

with an `eslint.config.js` per the "Consumer setup" example above, adding
your repo's `relaxZones(...)` call for any not-yet-compliant directories, and
a `.prettierrc` with `"printWidth": 80`.

## Gate recipe 2 — changed-files lint (boy-scout, D8)

Run **strict** `configs.recommended` with **no `relaxZones` overrides** over
the files touched on the current branch, at **whole-file granularity** — if
you touch a file that lives in a relaxed zone, that whole file must come up
to the canonical standard (not just your diff lines):

```bash
git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx' \
  | xargs -r npx eslint --config path/to/strict-only.config.js --max-warnings 0
```

Where `strict-only.config.js` is `configs.recommended` (+ your repo's
`languageOptions`/`ignores`) with **no** `relaxZones()` override spread in —
so any file you touch, anywhere, is judged against the full canonical set.

## `relaxZones(globs, ruleOverrides)`

```js
relaxZones(["demo/**"], { "no-console": "off" });
// => { files: ["demo/**"], rules: { "no-console": "off" } }
```

Pure, no side effects. Spread it into your config array **after**
`...configs.recommended` so its overrides win for the matching files.

## Development (this package)

```bash
npm install
npm run build        # tsc: src/*.ts -> dist/ (.js + .d.ts)
npm run typecheck    # tsc --noEmit over src + tests
npm test             # vitest
npm run lint         # dogfoods configs.recommended on this package's own .ts source
                      # (build runs first — eslint.config.js imports ./dist/index.js)
npm run format       # prettier --write . (printWidth 80)
npm run format:check # prettier --check .
```
