# MLTT Block Workshop

Build Martin-Lof type theory terms with Blockly and get **bidirectional type checking** in real time. No build step; Blockly is bundled locally.

## Run

```bash
cd /workspace/mltt
node server.js 8000
# open http://localhost:8000
```

You can also open `index.html` directly (all scripts are classic scripts, so `file://` works).

Command-line demo / regression:

```bash
node demo.js        # print the knowns, goals, and reference solutions for all 23 levels
node test/test.js   # 58 checker + scope tests
```

## Layout

```
core.js      Pure-JS MLTT core: de Bruijn, NbE, conv, check/infer, printing
levels.js    23 levels (written as named open terms; close() converts to de Bruijn)
blocks.js    Blockly block definitions + lexical binding module (LBM) + custom variable field
app.js       workspace, levels, checking, hints, stars, localStorage progress
index.html / style.css
server.js    zero-dependency static server
vendor/      Blockly 11.2.2 (UMD + media) + localized lexical-variables (UMD)
tools/       ui-shots.js (headless Chromium screenshots/smoke tests), get-blockly.js
```

## Implemented blocks

- Top level: `answer |-` (generated automatically for each level, cannot be deleted; checking reads only this block, so all other blocks are scratch)
- Types: `Pi` `Sigma` `Id` `Nat` `Bool` `0` (empty) `1` (unit) `Type 0/1`
- Terms: `lambda` `variable` `application` `pair` `0/suc` `true/false/star` `refl` `let` `annotation` `hole` `given`
- Eliminators: `natrec` `unitrec` `sigma_ind` `J` `if` `absurd`
- The product/Sigma levels derive `fst`/`snd` with `sigma_ind`; primitive `fst`/`snd` blocks are not offered in the toolbox.
- Lemma: `add` (transparent definition, delta-reduction)

## Answer slot

When a level loads, an answer block is generated in the center of the canvas; its `TERM` slot is where you submit. The block itself is displayed as the sequent `knowns |- [answer] : goal` (universe knowns such as `A : Type` are hidden), so the problem and the answer slot are one block. Levels with `answerBinders` also show one or more interactive local variables before the `|-` (for example, L3 has `f` and `x`, and L4 also has `y`). They behave like lambda binders and share the variable block's color: hovering pops up the corresponding variable block through `@mit-app-inventor/blockly-block-lexical-variables`'s flydown, and you can drag it into the slot; clicking a variable name renames it. Variable blocks in the slot bind to them automatically through LBM:

- cannot be deleted, can be moved; if undo or an accidental delete removes it, pressing Check restores it;
- `doCheck` only reads the term from its `TERM` input; other top-level blocks on the canvas no longer trigger "only one top-level term" errors and can be used freely as scratch;
- if the slot is empty, it tells you to drag a term in rather than failing silently;
- if multiple answer slots are copied, only the first one is checked; the rest get a warning and turn gray.

Some levels run in **type-inference mode**: the answer slot shows a fixed term (for example `f x :`) and the hole expects that term's type. The context entries are local variables, so the type is submitted as a variable block - for example `B`.

Levels can also set `requireBlock`; `checkBlocks` rejects an otherwise well-typed answer that does not contain the required block (L10 uses this to force the unit computation rule).

`core.js`'s `elabBlock` treats `tt_answer` as a transparent container (`tt_goal` is kept as an old name), so pure Node tests can also wrap block JSON directly.

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
5. When paste invalidates a uid, it falls back to the nearest same-named binder by the saved name (intentional lexical-scope behavior);
6. New binders avoid outer variables with the same name by default (if `x` already exists outside, a new lambda is called `y`); manually renaming to a duplicate is rejected.

## Type checking

`check` / `infer` bidirectional + NbE:

- Values: `Pi/Sigma/Lam/Pair/Neutral...`; the context stores **values**, with no substitution;
- `conv` performs beta/iota/delta + eta (Pi, Sigma);
- `lambda`, `pair`, `refl`, `if`, and `absurd` are accepted only in check mode, matching MLTT;
- Hole `?` records the goal type and local context;
- No cumulativity; `Type 0 : Type 1`.

## Levels

> Currently the UI exposes only L0-L16 (`levels.slice(0, 17)` in `app.js`); the remaining level data is still there and can be re-enabled.

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
| 9 | `C : 1->Type, u : 1, c : C star |- C u` | unit elimination (`unitrec`) |
| 10 | `C : 1->Type, c : C star |- C star` | unit computation (`unitrec star C c = c`) |
| 11 | `A : Type, e : 0 |- A` | empty elimination (`absurd`) |
| 12 | `a : A, b : B |- A x B` | product introduction (`pair`) |
| 13 | `|- (Sigma x : A. B x) -> A` | Sigma elimination (`sigma_ind`, fst) |
| 14 | `|- (A x B) -> B` | Sigma elimination (`sigma_ind`, snd) |
| 15 | `|- refl : Id A a a` | identity introduction (`refl`) |
| 16 | `|- Type 0 : Type 1` | universe (`Type`) |
| 17 | `Pi A:Type. A -> A` (polymorphic identity) | Pi type (dependent codomain) |
| 18 | `Id Nat (add 2 2) 4` | delta-reduction |
| 19 | `B y` (transport) | J |
| 20 | `Pi A:Type. Id Type A A` | universes |
| 21 | `Id A x z` (transitivity) | two Js |
| 22 | `not not not P -> not P` (triple negation) | negation as `P -> 0` |

Stars: <= reference block count with no hints = 3 stars; <= reference + 2 with <=1 hint = 2 stars; otherwise 1 star.

## Tests

`node test/test.js`: 23 level reference solutions, 9 error paths, 13 scope/elaboration cases (including answer slots and required-block checks), 7 NbE cases, 4 triple-negation cases for L22, and 2 printing cases - 58 items total.

`tools/ui-shots.js` uses a headless Playwright browser to actually build L0 and L4, click Check, and take screenshots (`shot-l0.png`, `shot-l4.png`, `shot-escape.png`, `shot-mobile.png`). Running it requires `npm i playwright` and `npx playwright install chromium`.

## Known limitations

- No cumulativity, implicit arguments, or metavariable solving;
- The type of J's motive is determined by the rule and cannot be annotated manually;
- Copy/paste relies on name fallback, so extreme same-name cases may rebind;
- The workspace is not persisted; only stars and level progress are stored in localStorage;
- Mobile layout has basic adaptation; complex blocks (J) require zooming.
