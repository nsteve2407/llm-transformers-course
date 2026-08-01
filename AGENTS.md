# AGENTS.md

Instructions for any AI agent picking up work on this repository.

## What this is

A 13-module, self-paced LLM/Transformers course built as a Jekyll (Just the Docs theme) site,
deployed to GitHub Pages at `https://nsteve2407.github.io/llm-transformers-course/`. Each module has
a content page, a reading list, an interactive quiz, and (except Module 13) a paired Colab
starter/solution notebook. A per-module chat widget proxies through a Cloudflare Worker to the
Anthropic API so learners can ask questions grounded in that module's content.

**Status as of 2026-08-01: all 13 modules are complete and live.** This is not a "finish the
course" task anymore — treat any new work as maintenance, extension, or fixing something a learner
reported. If asked to add a 14th module or substantially rework an existing one, follow the same
process described below (it is not optional busywork; it's what caught every real bug in the 13
modules that exist).

## Source of truth — read these before touching content

1. **`docs/superpowers/specs/2026-07-31-llm-transformers-course-design.md`** — the master design
   spec. Every module's subtopics, reading-list URLs (pre-verified, do not alter), exercise
   description, and quiz-topic list comes from here. If you are adding or correcting content, check
   what the spec says first — don't invent scope.
2. **`docs/superpowers/plans/*.md`** — one implementation plan per batch of modules (2-3 modules
   each, except the last which is Module 13 alone). Each plan's "Global Constraints" section is a
   running list of conventions established by that point, several of which exist specifically
   because an earlier plan shipped a bug without them. Read the *latest* plan file
   (`2026-08-01-module-13-capstone.md`) for the fullest, most current list of constraints — earlier
   plans' constraints are superseded/accumulated there.
3. **`README.md`** — setup steps, notebook dependency list, course content status.

## Architecture at a glance

```
modules/<NN-slug>/{index.md, reading.md[, project-brief.md]}   # Jekyll content, Just the Docs nav
_data/quizzes/<NN_slug>.yml                                     # quiz question bank (YAML)
notebooks/<NN-slug>/{exercise_starter.ipynb, exercise_solution.ipynb}  # paired Colab notebooks
assets/js/{quiz.js, quiz-logic.mjs, chat-widget.js}              # client-side JS, no build step
_includes/{quiz.html, chat-widget.html}                          # Liquid includes wiring data → JS
worker/                                                          # Cloudflare Worker (chat proxy)
scripts/build_chat_context.mjs                                   # generates worker/src/context/*.json
test/*.test.mjs                                                  # node --test, no framework
worker/test/*.test.ts                                            # vitest
```

- Quiz include syntax is **dot notation** (`site.data.quizzes.09_vit`), never bracket notation —
  bracket notation is a hard Jekyll parse failure for digit-leading keys.
- New module pages need `has_children: true`; `reading.md`'s `parent:` must exactly match the
  module page's `title:`; modules nest under `modules/index.md` via `parent: Modules`.
- `_config.yml` has a `defaults:` block applying the `default` layout site-wide, with a narrower
  `path: "assets"` override resetting `layout: null` — don't remove either without checking both
  page rendering and that CSS files don't get wrapped in HTML again.

## Non-negotiable conventions (each exists because skipping it shipped a real bug)

### Quiz authoring (`_data/quizzes/*.yml`)
- Schema: `{type: mcq, question, choices, answer_index, explanation}` or
  `{type: short, question, answer_keywords, model_answer, explanation}`.
- 8-10 questions per file, ~70/30 mcq/short ratio.
- `test/quiz-data.test.mjs` enforces: no bare/loosely-anchored numeric or single-word
  `answer_keywords` (route numeric facts to MCQ instead); `answer_index` not all identical; correct
  MCQ choice not the longest in more than half the file's questions; every `model_answer` self-grades
  correct against its own `answer_keywords` (grading is a plain case/punctuation-insensitive
  substring check — see `assets/js/quiz-logic.mjs`'s `gradeShortAnswer`).
- **Beyond what the test checks**: spread `answer_index` genuinely across all four positions, not
  just "not all identical" (a file that technically passes with a skewed distribution — e.g. one
  index never used — is a real quality bug a learner can exploit; caught in `10_swin.yml` after it
  shipped). Keep real margin on choice-length balance, not just under the test's ceiling
  (`11_detr.yml` initially sat exactly at the boundary). Never write a distractor containing
  self-refuting language ("...but this isn't actually true") — a learner can eliminate it without
  domain knowledge; every distractor must be a plausible wrong answer someone might genuinely hold.
- **Automated tests cannot catch semantic/causal errors.** Two real bugs shipped past every
  automated check and were only caught by a reviewer independently re-deriving the technical claim:
  Module 11's quiz had the L1-vs-GIoU scale-bias direction backwards; Module 13's project brief
  initially misdefined Recall@k as a binary hit-rate instead of the correct fractional definition.
  Before finalizing any question with a causal/methodological claim, re-derive it from the source
  paper or spec — don't trust that it "reads correctly."

### Notebooks (`notebooks/<slug>/*.ipynb`)
- Paired `exercise_starter.ipynb` / `exercise_solution.ipynb`, nbformat 4. Starter stubs the
  hardest/most pedagogically central pieces with `raise NotImplementedError("TODO: ...")` plus a
  one-line hint; every other cell must be **byte-identical** to the solution — including any driver
  code / assertions that run the stubbed function. (A real bug: a starter once stubbed a function but
  dropped the cell's driver call and sanity assertions, so a learner who filled in the stub correctly
  still got zero feedback and a `NameError` from constants that got dropped along with it.)
- Colab badge + module link in the header cell. `SMOKE_TEST` environment-variable pattern for a fast
  CI-friendly run. `metadata.language_info.version` must be `"3.11"` (not the authoring machine's
  actual Python — this leaked as a Minor bug once).
- **Cell `source` fields must be JSON line-lists, not single strings.** This exact regression has
  recurred *many* times across plans (hand-editing or programmatic notebook edits sometimes collapse
  it). After any notebook edit, verify explicitly:
  ```bash
  python3 -c "import json; nb=json.load(open('PATH')); print(all(isinstance(c['source'], list) for c in nb['cells']))"
  ```
- **SMOKE_TEST must use real pretrained weights** for any exercise centered on what pretraining
  buys you (Modules 8-12) — only shrink dataset size / epoch count / step count. Only Module 5 uses
  config-only random-weight loading, because that module is about architecture, not pretraining.
- Guarded install cells for any package beyond Colab's defaults:
  ```python
  try:
      import <package>
  except ImportError:
      %pip install -q <package>
  ```
  Document every such dependency in `README.md`'s "Notebook dependencies" section.
- **Fair-comparison principle**: when a notebook compares two models/configs, keep confounding
  factors controlled (comparable param counts, same data subset, same budget) so the observed
  difference is attributable to the thing being taught. If a real uncontrolled difference exists
  (e.g. comparing a 2.7M-param from-scratch model against an 86M-param pretrained checkpoint),
  disclose it explicitly in a markdown cell rather than silently letting the conclusion overclaim.
- **Correctness discipline for custom algorithms/metrics**: don't just verify code "runs" — verify
  the actual property being taught. Concrete precedent: a PPO KL-penalty term that looked like a
  real regularizer but had zero expected gradient (caught via gradient-norm measurement, not code
  review); a masking implementation independently checked against ground-truth spatial adjacency,
  not just self-consistency; GIoU unit-tested against hand-computed values.

### Environment (Python 3.6.9, this sandbox's ML toolchain)
- `transformers==4.18.0`, `torch==1.10.2`, `torchvision==0.11.2`, `timm==0.6.12`,
  `torchmetrics==0.8.2`, `scipy==1.5.4` are the verified-working pins.
- **`pip install` in this environment can silently downgrade an already-correct package** via stale
  dependency resolution (this happened: installing `timm` downgraded `torch` 1.10.2→1.7.1 with no
  warning). Before any pip install, note `torch.__version__`/`torchvision.__version__`; immediately
  after, re-check they haven't changed. If a notebook's guarded install cell's `except` branch
  actually fires (rather than hitting `try` because the package is already present), treat that as a
  signal to stop and verify the environment, not something to shrug off.
- `transformers==4.18.0` and old `huggingface_hub` versions don't resolve a *relative* redirect
  `Location` header that HF's servers now return on checkpoint downloads — this was patched directly
  in the installed packages (`transformers/utils/hub.py` and `huggingface_hub/file_download.py`,
  both using `urllib.parse.urljoin(url, r.headers["Location"])` instead of the raw header). If HF
  downloads start failing again with `MissingSchema`/`couldn't connect to huggingface.co`, check
  whether that patch is still present before assuming a network problem.
- `transformers==4.18.0` has `DetrFeatureExtractor`, not `DetrImageProcessor` (added in a later
  version) — and its hosted `facebook/detr-resnet-50` preprocessor config's dict-style `size` field
  crashes it; pass `size=800, max_size=1333` explicitly instead (documented in Module 11's notebook).

## The process for any non-trivial change

This repo was built via Claude Code's `superpowers` skill set using **subagent-driven-development**:
a fresh implementer subagent per task, a task-scoped reviewer after each, and a whole-branch review
(on the most capable available model) at the end of each plan, with a bounded fix-loop for any
Critical/Important finding. This was not overhead — every plan's final review found and fixed at
least one real bug that slipped past per-task review. If you have access to the same tooling
(`superpowers:subagent-driven-development`, `superpowers:writing-plans`,
`superpowers:brainstorming`), use it for anything beyond a one-line fix:

1. Brainstorm/scope the change against the design spec — don't invent requirements.
2. Write a plan under `docs/superpowers/plans/` following the existing plans' structure (Global
   Constraints section copied/extended from the most recent plan, then per-task Files/Steps).
3. Execute task-by-task with a fresh implementer + reviewer per task.
4. Whole-branch review before merging, on the most capable model available.
5. Push, watch the `Build and deploy Pages` GitHub Action, verify the live URL returns 200.

If you don't have that tooling, at minimum: read the relevant module(s) and the latest plan's
Global Constraints before editing, run the full test suite before AND after your change
(`node --test test/*.test.mjs`, `cd worker && npm test`, `bundle exec jekyll build`), and don't trust
your own read of "this looks right" for any technical/causal claim — verify it against source.

## Commands

```bash
bundle exec jekyll build          # full site build; must exit 0 (pre-existing Sass deprecation
                                   # warnings from the just-the-docs theme are expected and harmless)
bundle exec jekyll serve          # local dev server
node --test test/*.test.mjs       # quiz-data, quiz-logic, chat-client tests
cd worker && npm test             # rate-limit, history tests (vitest)
ruby -ryaml -e "puts YAML.load_file('_data/quizzes/<file>.yml').length"   # sanity-check a quiz file
SMOKE_TEST=1 jupyter nbconvert --to notebook --execute --output /tmp/out.ipynb notebooks/<slug>/exercise_solution.ipynb   # solution must exit 0
SMOKE_TEST=1 jupyter nbconvert --to notebook --execute --output /tmp/out.ipynb notebooks/<slug>/exercise_starter.ipynb    # starter must fail with NotImplementedError
```

## CI / deploy

- `.github/workflows/pages.yml` builds and deploys on push to `master` (paths: `_config.yml`,
  `Gemfile*`, `index.md`, `modules/**`, `_data/**`, `_includes/**`, `assets/**` — a change outside
  these paths, e.g. only touching `notebooks/**` or `docs/**`, will NOT trigger a rebuild; use
  `gh workflow run pages.yml` or `workflow_dispatch` if you need to force one).
- `.github/workflows/worker-deploy.yml` deploys the Cloudflare Worker on push touching `worker/**`
  or `modules/**` (it regenerates `worker/src/context/*.json` via `scripts/build_chat_context.mjs`
  first). Its deploy step is gated `if: secrets.CLOUDFLARE_API_TOKEN != ''` — it will show as a fast
  `failure` in `gh run list` when that secret isn't configured. **This is expected, not a bug** — it
  has shown this exact pattern on every push since the secret was never set up. See README.md's
  "One-time setup for the chat widget" for what's needed to make it actually deploy.
- After any push, confirm with `gh run watch <run-id> --exit-status` and then
  `curl -s -o /dev/null -w "%{http_code}\n" "<live-url>?cb=$(date +%s)"` — don't assume success from
  the push alone.

## Known open item (not a code bug)

The chat widget UI is live on all 13 pages, but the Cloudflare Worker backend has never actually been
deployed (no `CLOUDFLARE_API_TOKEN` secret configured, no Anthropic API key set via
`wrangler secret put`). This is a one-time manual setup step for a human with Cloudflare/Anthropic
account access — see README.md §"One-time setup for the chat widget". Don't attempt to configure
secrets or deploy the Worker yourself without the user's explicit go-ahead, since it involves
external account credentials.
