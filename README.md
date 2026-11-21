# MLTT Block Workshop

Build Martin-Lof type theory terms with Blockly and get **bidirectional type checking** in real time. Runtime dependencies are installed with npm; Vite provides development and production builds.

## Run

```bash
npm install
npm start
# open http://localhost:8000
```

Requires Node.js 18.18+, 20.9+, or 22 and later. Use `npm run dev` for the same development
server, or `npm start -- --port 8080` to choose another port. Open the app through
HTTP; the source HTML uses module imports and cannot be opened directly via `file://`.

```bash
npm run build     # generate the standalone static site in dist/
npm run preview   # serve dist/ locally at http://localhost:8000
```

Blockly 11.2.2 and the lexical-variable plugin 11.0.3 are pinned npm dependencies.
Commit `package-lock.json`; use `npm ci` for reproducible installs. Blockly media
is served from the installed package in development and copied into `dist/media/`
at build time. The output loads its assets locally and needs no CDN. `node_modules/`
and `dist/` are generated and stay out of Git.

Use the header language selector to switch between English and Simplified Chinese.
The initial language follows the browser; later visits use your saved choice.
Switching preserves the current blocks (including scratch blocks, variable names,
bindings and positions), zoom and level without reloading.
Level text, block help, Blockly menus and checker errors are localized; mathematical
notation and variable names stay unchanged. All 25 levels have Chinese text,
including the levels not currently exposed in the UI.

## Construction workshop

The left block shelf stays open. Every given and answer-slot variable has its own
draggable reference, including type variables. Use the header block-library button
to switch between the level's suggested blocks and the complete library; the
level palette no longer limits what can be constructed.
In custom mode, drag a **Problem** card from the left library to the desired canvas position, just like other blocks. There are no duplicate add buttons or automatic recentering. Preset mode keeps **Locate problem** to find its existing frozen container.

The workshop panel displays the level introduction, an **+ Note** button, and
selected-expression type feedback. Symbols and local variables are dragged from
the left shelf; local references must remain inside their binder's scope.
The panel has no duplicate symbol browser or declaration-creation controls.
Older shared workspaces containing assumptions, definitions, or axioms remain
readable and checked; dependency feedback still identifies assumptions used.

Canvas notes are separate from checked expressions. Use **+ Note** or a block's
context menu to create a plain-text card. Cards can be moved, resized, collapsed,
and attached to a block so they follow it. Tutorial explanations are read-only
and keep their own position-restoration control. All exposed levels (L0–L16) include bilingual
explanations beside the answer, with larger text and cards for detailed guidance.
Personal notes are saved per level in this
browser and survive answer resets and reloads. Delete each personal note using
its own × button. Notes do not affect type checking. If a referenced scratch block is removed, its note stays on the
canvas as a free card.

Run `node test/declarations.js` for declaration checks and
`node tools/browser/workshop-test.js` for workshop interactions (defaults to Edge;
set `PLAYWRIGHT_CHANNEL` to choose another installed browser).
Run `node tools/browser/notes-test.js` to check note editing, persistence,
attachment, dragging, resizing, and individual deletion.
Run `node tools/browser/tutorials-test.js` to verify tutorial coverage and placement.

## Custom mode and sharing

Choose **Custom** in the header to open an independent blank canvas with the full
block library. Add a **Problem** checking container and place any expression,
judgment, or inference card in its single `TERM` submission input. A judgment
has real term and type inputs; an inference has real premise, rule, and conclusion
inputs.
When several problems exist, select a problem or one of its children before
checking. Checks report whether the content is valid and any assumptions used.

The custom canvas is saved locally, including positions, declarations, bindings,
layout options, and notes. Switching back to levels restores the unfinished
level you left. Right-click a judgment card to choose **Automatic**,
**Inline**, or **Stacked** layout; automatic layout uses the available width.

The address updates automatically after canvas edits, including block positions,
fields, layout, locks, and personal notes. An untouched preset uses a short
`?level=L3` link. Once edited, its address keeps that level parameter and adds a
versioned, deflate-compressed `#workshop=v1.…` payload containing the current
canvas. Custom mode uses the compressed payload without a level parameter.
Copy the address at any time, or use **Share** to copy the latest state. Opening
the link restores answers, scratch blocks, and notes. Edits replace the current
address instead of adding browser history entries. Data stays in the URL; there is no upload service.
The recipient needs access to the same application URL. When clipboard copying
is unavailable, a dialog displays the link for manual copying. Unsupported,
damaged, or oversized payloads show an error and preserve the current canvas.

Inference cards now have a detachable `RULE` slot beside the line. **Π-elim**
applies a function to an argument. **Apply theorem** takes a theorem/function
expression with two arguments and uses the two premises as those arguments.
The rule and theorem are checked structurally, not inferred from display labels.

Run `node test/custom.js`, `node test/rules.js`, and
`node tools/browser/custom-test.js` for custom checks and share round trips.
Run `node tools/browser/url-sync-test.js` for automatic URL updates and direct-copy restoration.
Run `node test/entry.js` and `node tools/browser/containers-test.js` for single-entry
checking, nested judgments, and preset/custom container consistency.

Translations use the small `src/i18n/index.js` service and dictionaries under
`src/i18n/locales/`. The checker keeps its English
`message` for compatibility and provides `messageKey` / `messageParams` for display.

Command-line demo / regression:

```bash
npm run demo       # print all 25 levels and reference solutions
npm run lint       # at most 500 code lines per JavaScript file; ignores blank/comment-only lines
npm test           # 60 checker + scope tests
npm run test:ui     # starts its own development server and browser regression
```

Run `npx playwright install chromium` once before the browser regression, or
set `PLAYWRIGHT_CHANNEL=chrome` (or `msedge`) to run the browser regression with
an installed browser instead of Playwright's bundled Chromium. Set
`MLTT_TEST_BUILD=1` to run the same browser checks against `dist/` after building.
The browser regression uses local ports 18743 (development) and 18744 (preview).

## Layout

```
index.html        HTML entry point
vite.config.mjs   development/build settings and Blockly media handling
src/
  main.js         npm imports and application initialization
  core/mltt.js    pure-JS MLTT checker, evaluation and printing
  levels/index.js 25 levels and reference solutions
  blockly/blocks.js  Blockly definitions and lexical binding
  ui/
    app.js        application shell and level navigation
    style.css     shared application styles
    workspace/    block library, scope feedback and workspace tools
    problems/     preset construction, custom mode and answer switching
    notes/        canvas notes and both sets of lesson explanations
    sharing/      compressed URLs and session sharing
  i18n/index.js   language selection and message formatting
  i18n/locales/   block, level and checker translations
tools/
  cli/demo.js     command-line level demonstration
  browser/        Playwright checks and screenshot utilities
test/             checker and scope regression tests
package.json      project metadata, commands and development dependencies
```

ESLint checks all JavaScript files, including tests and tools, using
`eslint.config.mjs`. Each file may contain at most 500 lines of code; blank lines
and comment-only lines are excluded. A line containing both code and a comment
still counts. Generated output in `dist/` and dependencies in `node_modules/` are
excluded. Split files by responsibility when they reach this limit.

## Implemented blocks

- Top level: checking container with a name and one submission input;
  preset levels prefill and lock parts of the content, custom content is editable.
- Types: `Pi` `Sigma` `Id` `Nat` `Bool` `0` (empty) `1` (unit) `Type 0/1`
- Terms: `lambda` `variable` `application` `pair` `0/suc` `true/false/star` `refl` `let` `annotation` `hole` `given`
- Eliminator functions: `ind_nat` `ind_unit` `ind_sigma` `J`, combined with ordinary applications and lambdas; partial application is supported. `if` and `absurd` retain their expression blocks.
- `ind_sigma A B p motive step` and `J A a motive base b proof` take explicit type arguments. The function symbol's `A : Type` and `B(a) : Type` fields select their universe levels independently.
- The product/Sigma levels derive `fst`/`snd` with `ind_sigma`; primitive `fst`/`snd` blocks are not offered in the toolbox.
- Lemma: `add` (transparent definition, delta-reduction)

## Checking container

Both modes use `tt_problem`: a `NAME` field and one `TERM` submission input.
The shell has no separate requirement or given-context section. Its content can
be a plain expression, a `tt_judgment`, or a `tt_rule_app` inference tree. Other
canvas blocks are scratch work and do not count as submissions.

A judgment contains actual `TERM` and `TYPE` inputs. Checking verifies the term
has the stated type. A rule contains an ordered premise list (`F`, `A`, then `P2`, `P3`, ...), a `RULE`, and a `RESULT`;
checking verifies its premises and the conclusion, including that the conclusion
agrees with the selected rule after normalization. Empty inputs remain visible
puzzle sockets and report incomplete work; display text is never proof evidence.

Preset levels fill and lock parts of this same content. A term-construction task
locks the judgment's type and leaves its term empty. A type-inference task locks
the expression and leaves its type empty. Inference examples leave the rule and
conclusion term for the player to construct. Judgments and rules contain ordered `CONTEXT0`, `CONTEXT1`, ... slots for `tt_binding` declarations. Right-click to add or remove declarations; later declarations and the body can use earlier names. Local references retain stable lexical IDs through locale changes and sharing.
Preset goals and required constructions are represented by frozen cards, including the ordinary applications headed by `ind_unit` in L10. The checker reads the cards themselves in both modes; preset containers have no hidden variables or conditions. Dedicated eliminator cards and conversion menus are removed; the underlying primitive computation rules remain in the checker.

Custom problems allow any supported content. Right-click a block to freeze or
unfreeze it when authoring a puzzle; freezing survives saving and sharing.
A frozen block cannot be edited, detached, replaced, or deleted through its parent.
Freezing a block leaves its children independently editable, so authors can freeze
given content while keeping nested answer slots available. Plain expressions are inferred;
judgments supply an expected type for constructions such as lambdas and pairs.
When multiple problems exist, select the one to check. Older `tt_answer` and
requirement/submission workspaces migrate to the single-entry representation.

Every preset provides **View answer** below its description. It temporarily fills the main canvas with a complete checked answer. The button changes to **Back to work**, which restores the player’s exact blocks, notes, and view. Answer blocks use the existing inspection and editing tools. Answer-mode URLs also retain the original work, so reloading still lets the player return to it.

Problem guides explain notation, available conditions, and the goal. Answer mode switches the same tutorial card to a solution walkthrough, explaining the construction and why each step is valid. Personal notes remain separate.

Run `node tools/browser/answers-test.js` to verify all 19 answer previews.

## Lexical binding module (LBM)

Blockly's built-in variables (workspace-global) are not used. Each binder writes its uid into `ttBinds` during `init`:

```js
ttBinds = { DOM: [], BODY: ['b<blockId>:x'] }
```

The variable block's dropdown walks up the ancestor chain, and **only binders whose path goes through that input slot** appear - so `x` is not visible in the `A` slot of `Pi (x : A) -> B`.

Six layers of defense:

1. Variable blocks have only an output, so they cannot stand alone as statements;
2. The dropdown filters by real scope;
3. After moves/creates/deletes, references are revalidated; stale variables get a warning icon and turn gray;
4. Elaboration produces de Bruijn indices, and a missing binder reports `E_SCOPE` (no silent rebinding);
5. Copying a whole subtree remaps references only to binders created in that same copy; moving a reference outside its scope remains an error;
6. New binders avoid outer variables with the same name by default (if `x` already exists outside, a new lambda is called `y`); manually renaming to a duplicate is rejected.

## Type checking

`check` / `infer` bidirectional + NbE:

- Values: `Pi/Sigma/Lam/Pair/Neutral...`; the context stores **values**, with no substitution;
- `conv` performs beta/iota/delta + eta (Pi, Sigma);
- `lambda`, `pair`, `refl`, `if`, and `absurd` are accepted only in check mode, matching MLTT;
- Hole `?` records the goal type and local context;
- No cumulativity; `Type 0 : Type 1`.

## Levels

> The UI exposes L0-L16 and the inference-rule examples R0/R1. L17-L22 remain in the data and can be re-enabled.

R0 (“Your first inference”) starts with an inference card inside the submission
entry. Fill its premise slots with `f` and `x`, choose `Π-elim` beside the line,
and construct `f x` in the conclusion judgment whose target type `B` is locked.
R1 uses explicit judgment cards as premises: fill the first with `f` and the
second with `x`; the rule and conclusion are filled in the same way. The shared context is constructed above the rule from public declaration cards. Every blank is a connectable input.

Premises and conclusions accept terms or nested judgments. Rules can be nested;
they elaborate to ordinary MLTT applications, so type, scope, and normalization
checks all use the same checker. The older duplicate inference block name remains
readable in saved workspaces; only the unified card appears in the library.

Right-click a premise list or condition list to add, remove, or reorder entries. Removed filled entries return to the canvas. Lists support zero or more entries (up to 64); Π-elim requires exactly two premises, while applying a theorem accepts as many arguments as its type permits.

Run `node test/contexts.js`, `node tools/browser/context-freeze-test.js`, `node tools/browser/parity-test.js`, and `node tools/browser/context-migration-test.js` for contexts, freezing, all 19 preset/custom equivalence checks, and old saves.

| # | Goal | New blocks |
|---|---|---|
| 0 | `x : A |- x : A` | local variables (LBM) |
| 1 | `A -> A` | lambda |
| 2 | `x : A |- B -> A` | lambda, outer variables |
| 3 | `f : A->B, x : A |- B` | application |
| 4 | `f : A->B->C, x : A, y : B |- C` | two applications |
| 5 | `f : A->B->C, x : A |- B -> C` | currying, partial application |
| 6 | `f : A->B, x : A |- f x : ?` | type inference (answer is a type) |
| 7 | `f : (x:A) -> B x, a : A |- f a : ?` | Pi application inference |
| 8 | `|- star : 1` | unit introduction |
| 9 | `C : 1->Type, u : 1, c : C star |- C u` | unit elimination (`ind_unit`) |
| 10 | `C : 1->Type, c : C star |- C star` | unit computation (`ind_unit star C c = c`) |
| 11 | `A : Type, e : 0 |- A` | empty elimination (`absurd`) |
| 12 | `a : A, b : B |- A x B` | product introduction (`pair`) |
| 13 | `|- (Sigma x : A. B x) -> A` | Sigma elimination (`ind_sigma`, fst) |
| 14 | `|- (A x B) -> B` | Sigma elimination (`ind_sigma`, snd) |
| 15 | `|- refl : Id A a a` | identity introduction (`refl`) |
| 16 | `|- Type 0 : Type 1` | universe (`Type`) |
| 17 | `Pi A:Type. A -> A` (polymorphic identity) | Pi type (dependent codomain) |
| 18 | `Id Nat (add 2 2) 4` | delta-reduction |
| 19 | `B y` (transport) | J |
| 20 | `Pi A:Type. Id Type A A` | universes |
| 21 | `Id A x z` (transitivity) | two Js |
| 22 | `not not not P -> not P` (triple negation) | negation as `P -> 0` |

Levels provide direct checking and navigation, with no star ratings or hint controls.

## Tests

`node test/test.js`: 25 level reference solutions, 9 error paths, 13 scope/elaboration cases (including answer slots and required-block checks), 7 NbE cases, 4 triple-negation cases for L22, and 2 printing cases - 60 items total.

`npm run test:ui` verifies language switching, unfinished/completed workspace
preservation, variable binding and hover flydowns, progress persistence and
Blockly media requests. It starts and closes its own Vite server.

## Known limitations

- No cumulativity, implicit arguments, or metavariable solving;
- The type of J's motive is determined by the rule and cannot be annotated manually;
- Copy/paste relies on name fallback, so extreme same-name cases may rebind;
- Custom workspaces persist locally; ordinary level reloads retain the selected level,
  while mode switches also preserve the unfinished level workspace;
- Mobile layout has basic adaptation; complex blocks (J) require zooming.

## GitHub Pages

The `CI and GitHub Pages` workflow checks every push and pull request: clean dependency installation, ESLint, all checker regressions, production build, and a Chromium regression against the built application. Successful builds on `main` publish `dist/` through the `github-pages` environment. Other branches and pull requests run checks without deploying.

A repository administrator must enable **Settings → Pages → Build and deployment → Source: GitHub Actions** before the first deployment. Private repositories also need a GitHub plan that supports Pages. The workflow can be started again from Actions with **Run workflow** after enabling Pages. No repository visibility changes or personal access token secrets are required.

Vite uses a relative base (`./`), so generated assets and Blockly media work under the repository subpath as well as at a domain root.
