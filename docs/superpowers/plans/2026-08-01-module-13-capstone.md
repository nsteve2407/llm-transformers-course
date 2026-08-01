# Module 13 (Capstone) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Part 4 (Capstone) — Module 13 — the final module of the 13-module course. Unlike Modules 1-12, this module is project-based and open-ended: per the design spec (`docs/superpowers/specs/2026-07-31-llm-transformers-course-design.md` §4, line 557, and §8 line 619), it gets a **project-brief markdown page instead of starter/solution notebooks**, since the work is a genuinely open-ended 1-2 week project the learner scopes themselves, not a fill-in-the-stub exercise with one correct implementation.

**Architecture:** Same as the existing site. All shared infrastructure already exists and needs no changes. This module's `index.md` follows the established pattern (frontmatter, subtopics-equivalent summary, quiz include, chat widget include), but its "coding exercise" section links to a new `project-brief.md` child page instead of a Colab notebook, and there is no `notebooks/13-capstone/` directory. This is the last module in the course — Task 4 includes a whole-course sanity pass (all 13 modules navigable, full test suite, README status update) since after this plan the course is complete.

**Tech Stack:** Jekyll/Liquid/YAML (content only — no notebooks, no new Python dependencies).

## Global Constraints

- Every "Where to go next" pointer URL must be copied EXACTLY from `docs/superpowers/specs/2026-07-31-llm-transformers-course-design.md` §4 (Module 13 at line 557-575) — no alterations. These pointers (diffusion models, LLaVA, LLM agents/ReAct) are explicitly framed in the spec as "pointers beyond this course's scope, not full modules" — `reading.md` must preserve that framing, not present them as required/optional course reading in the same style as Modules 1-12's paper lists.
- Quiz include syntax must use dot notation (`site.data.quizzes.13_capstone`), never bracket notation.
- `modules/13-capstone/index.md` must set `has_children: true`. Both `reading.md` and the new `project-brief.md` child pages must have `parent:` exactly matching `index.md`'s `title:`. Module pages nest under `modules/index.md` via `parent: Modules`. `nav_order: 13` — this is the last module, verify no collision with 1-12.
- Chat widget include added directly in `index.md`.
- `index.md` should carry a one-line plain-text summary immediately under its H1, matching the established style (Modules 1-9, 11, 12 all have this; Module 10 initially omitted it and had to be fixed in a later plan — don't repeat that omission).
- **No `_data/quizzes` schema deviation despite this being a project-based module**: the design spec provides no "Quiz topics" list for Module 13 (unlike every other module, which has one) — this is because Module 13 has no single fixed body of facts to recall; the actual content is a project methodology, not a paper's claims. Per the site's own success criterion (§10: "Every quiz gives correct instant feedback for at least one right and one wrong answer per question, across all 13 modules"), Module 13 still needs a quiz — but it must be scoped to **capstone project methodology and evaluation practice that applies across all three options** (proper data splitting, why linear-probe vs. full-fine-tune tests different things, confusion-matrix/error-analysis practice, retrieval evaluation metrics like recall@k/MRR, decoding-strategy tradeoffs, why a stretch goal differs from a core deliverable, etc.) — NOT deep technical recall of any single Module 1-12 topic (that's already covered by that module's own quiz) and NOT testing "which option did you pick" content, since different learners pick different options. Same schema, same `test/quiz-data.test.mjs` invariants as every other quiz file.
- **Quiz authoring requirements, automated by `test/quiz-data.test.mjs` (MUST pass — run `node --test test/quiz-data.test.mjs`):** 8-10 questions, mcq fraction roughly 70/30, no bare/loosely-anchored numeric or single-word keywords in `answer_keywords`, `answer_index` values must be genuinely spread across all four positions (0-3, not just "not all identical" — this stricter bar was established in Plan 6 after Plan 5's `10_swin.yml` shipped a skewed-but-passing distribution), correct MCQ choice must not be the longest choice in more than half the file's questions with real margin (not just at the test's exact ceiling — Plan 6's final review flagged `11_detr.yml` for sitting exactly at the boundary), every short-answer `model_answer` must self-grade correct against its own `answer_keywords`.
- **Semantic accuracy discipline (established after Plan 6's Module 11 quiz shipped a Critical bug — a technical mechanism stated backwards, caught only by careful manual re-derivation, not the automated test)**: before finalizing any question, re-read its explanation and ask "is this causal/methodological claim actually correct, not just plausible-sounding?" Apply this with particular care to the data-splitting, evaluation-metric, and fine-tuning-mode questions, since these have precise correct answers that are easy to state subtly wrong (e.g. getting recall@k's actual definition wrong, or overstating what a confusion matrix alone can tell you vs. what needs the raw misclassified examples).
- **Distractor quality discipline (established after Plan 6's final review found self-refuting distractors)**: MCQ distractors must be plausible wrong answers a learner might genuinely hold as a misconception — never write a distractor containing language like "...but this isn't actually true" or "...which wouldn't really work" that lets a learner eliminate it without domain knowledge.
- **Project-brief content discipline**: for each of the three options (A/B/C) and the "alternatives" note, the brief must give a learner enough to actually start — concrete deliverables, a realistic scope for ~1-2 weeks part-time on a free/Colab-Pro GPU, and explicit success/evaluation criteria (not just "do X", but "and report/demonstrate Y so you know if it worked"). Copy the option descriptions from the spec (lines 561-567) as the core content, then expand each into an actionable checklist — do not invent anything not implied by the spec's own option descriptions, but DO make the implied evaluation methodology concrete (e.g. Option A's "evaluate quantitatively (held-out perplexity, self-BLEU/distinct-n)" becomes an explicit checklist item with a one-line definition of each metric for a learner who hasn't seen them before).

---

## File Structure

```
modules/
  13-capstone/{index.md, reading.md, project-brief.md}
_data/quizzes/
  13_capstone.yml
```

(No `notebooks/13-capstone/` — per spec, this module uses a project-brief page instead of starter/solution notebooks.)

---

### Task 1: Module 13 content pages (index.md + reading.md)

**Files:**
- Create: `modules/13-capstone/index.md`
- Create: `modules/13-capstone/reading.md`

- [ ] **Step 1: Write `modules/13-capstone/index.md`**

```markdown
---
title: "13. Capstone"
parent: Modules
nav_order: 13
slug: 13-capstone
has_children: true
---

# Module 13: Capstone

Apply what you've built across the course to one open-ended, self-directed project.

## Overview

This module is different from Modules 1-12: there's no fixed reading list of papers to master or a
single correct notebook to fill in. Instead, you pick one project (or propose a comparable
alternative) and work through it end-to-end — scoping, building, and evaluating it yourself, the
way you would outside a course. Each option below is scoped for roughly 1-2 weeks of part-time work
on a free or Colab-Pro GPU.

See the [Project Brief](project-brief.html) for the three options, their concrete deliverables, and
what "done" looks like for each — and the [Where to Go Next](reading.html) page for pointers past
this course's scope (diffusion models, vision-language instruction tuning, LLM agents) if you want
to keep going afterward.

## Options at a glance

- **Option A — Train a small GPT on tiny Shakespeare, study how it samples.** Build and train a
  small decoder-only Transformer from scratch, implement sampling strategies from scratch, and
  evaluate quantitatively and qualitatively.
- **Option B — Fine-tune ViT/Swin on a custom small image dataset, with real error analysis.**
  Compare fine-tuning strategies and dig into *why* the model gets things wrong, not just how often.
- **Option C — CLIP-based image search / retrieval mini-app.** Build a working text-to-image search
  tool over a curated image library, with a real evaluation set and retrieval metrics.
- **Alternatives**: a DETR-style detector fine-tuned for a downstream task, or an image-captioning
  project pairing a ViT/CLIP encoder with the Module 6 GPT decoder.

Full details, deliverables, and stretch goals for each are in the [Project Brief](project-brief.html).

{% include quiz.html slug=page.slug quiz=site.data.quizzes.13_capstone %}

{% include chat-widget.html slug=page.slug title=page.title %}
```

- [ ] **Step 2: Write `modules/13-capstone/reading.md`**

```markdown
---
title: "Where to Go Next"
parent: "13. Capstone"
nav_order: 1
---

# Where to Go Next

These are pointers **beyond this course's scope**, not additional required modules — topics you're
now equipped to explore on your own if you want to keep going after the capstone.

- Ho, Jain, Abbeel (2020). *Denoising Diffusion Probabilistic Models.* <https://arxiv.org/abs/2006.11239>
- Weng (2021). *What are Diffusion Models?* <https://lilianweng.github.io/posts/2021-07-11-diffusion-models/>
- Liu, Li, Wu, Lee (2023, NeurIPS Oral). *Visual Instruction Tuning (LLaVA).* <https://arxiv.org/abs/2304.08485>
- Weng (2023). *LLM Powered Autonomous Agents.* <https://lilianweng.github.io/posts/2023-06-23-agent/>
- Yao, Zhao, Yu et al. (2022/2023, ICLR). *ReAct.* <https://arxiv.org/abs/2210.03629>
```

- [ ] **Step 3: Verify locally**

Run: `bundle exec jekyll build` — expect no errors. `_site/modules/13-capstone/index.html` and `reading.html` will exist, but the build will reference `project-brief.html` (Task 2) and `site.data.quizzes.13_capstone` (Task 3) before either exists yet — this is fine and matches the established pattern from every prior module's Task 1 (e.g. Module 9's Task 1 referenced its not-yet-created quiz data); Jekyll renders a missing Liquid data reference as empty/null rather than failing the build, and a relative link to a not-yet-existing page is just a page that returns 404 until the later task lands. Confirm the build succeeds and confirm you are NOT trying to create `project-brief.md` in this task — that's Task 2.

- [ ] **Step 4: Commit**

```bash
git add modules/13-capstone/index.md modules/13-capstone/reading.md
git commit -m "Add Module 13 (Capstone) content and where-to-go-next pointers"
```

---

### Task 2: Module 13 project brief page

**Files:**
- Create: `modules/13-capstone/project-brief.md`

- [ ] **Step 1: Write the project brief**

Frontmatter:
```yaml
---
title: "Project Brief"
parent: "13. Capstone"
nav_order: 2
---
```

Body structure — for EACH of Option A, B, C, and the Alternatives note, expand the spec's description (`docs/superpowers/specs/2026-07-31-llm-transformers-course-design.md` lines 561-567) into:
1. A one-paragraph restatement of the option (from the spec, not invented).
2. A **Core deliverables** checklist — concrete, checkable items (e.g. for Option A: "decoder-only Transformer, 2-6 layers, trained from scratch on tiny Shakespeare", "greedy, temperature, top-k, and top-p sampling implemented from scratch (no library sampling calls)", "held-out perplexity reported", "self-BLEU and distinct-n reported and briefly interpreted", "qualitative sample review: a short written comparison of outputs across sampling strategies").
3. An **Evaluation / "how you know it worked"** subsection making the spec's evaluation language concrete with a one-line definition of any metric a learner might not already know (e.g. define self-BLEU, distinct-n, recall@k, MRR, confusion matrix, Grad-CAM/attention-rollout for error analysis — in plain language, one to two sentences each, not a full derivation since that's covered in the relevant earlier module).
4. A **Stretch goals** list (from the spec's stretch suggestions for that option, verbatim in spirit).
5. A rough **suggested scope** note reiterating the ~1-2 weeks part-time / free-or-Colab-Pro-GPU framing from the spec's header line for this section.

For Option A: RoPE swap, mini scaling-law curve, KV-cache benchmarking, fine-tune on a second corpus (all from spec line 561).
For Option B: ~1k-20k images, proper splits, full fine-tuning vs. linear-probe vs. partial unfreezing comparison, confusion matrix, highest-confidence wrong predictions, attention-rollout/Grad-CAM on correct vs. incorrect examples (spec line 563); stretch: ViT vs. Swin head-to-head, active-learning loop, Gradio demo, distillation.
For Option C: curate a local image library, embed with CLIP, index by cosine similarity (or FAISS), Gradio/Streamlit UI for free-text query → top-k images, hand-labeled query→relevant-image eval set reporting recall@k/MRR (spec line 565); stretch: zero-shot auto-tagging hybrid search, image-to-image search, larger/fine-tuned OpenCLIP checkpoint, FAISS ANN latency benchmarking.
For Alternatives (spec line 567): a DETR-style detector fine-tuned for a downstream task, or an image-captioning project pairing a ViT/CLIP encoder with the Module 6 GPT decoder on a small paired dataset (e.g. Flickr8k subset) — briefer treatment than A/B/C is fine here since the spec itself treats these as a one-line pointer, not a fully fleshed option, but still name concrete deliverables a learner could aim for.

Close with a short **General expectations for any option** section: a brief written report/README summarizing what was built, the evaluation results, and what you'd do differently with more time — this isn't in the spec verbatim but is a reasonable, minimal expectation for any self-directed project deliverable and should be flagged as a suggestion, not a rigid requirement, since this is explicitly an open-ended module.

- [ ] **Step 2: Verify locally**

Run: `bundle exec jekyll build` — expect no errors; `_site/modules/13-capstone/project-brief.html` exists and the module's nav sidebar shows both "Where to Go Next" and "Project Brief" as children of Module 13, in `nav_order` 1 and 2 respectively.

- [ ] **Step 3: Commit**

```bash
git add modules/13-capstone/project-brief.md
git commit -m "Add Module 13 project brief (options A/B/C, alternatives, deliverables)"
```

---

### Task 3: Module 13 quiz data

**Files:**
- Create: `_data/quizzes/13_capstone.yml`

- [ ] **Step 1: Author 8-10 questions**

Read `_data/quizzes/10_swin.yml`, `11_detr.yml`, and `12_clip.yml` as your style/quality/fairness reference. Per this plan's Global Constraints, this quiz covers **capstone project methodology and evaluation practice that applies across all three options**, not deep recall of any single Module 1-12 topic and not "which option" content.

Cover these topics (synthesized from the spec's capstone option descriptions, methodology-focused, not tied to one specific option):
1. Why proper train/val/(test) splits matter for a custom dataset, and what leaks/overfitting to watch for with a small (~1k-20k image) dataset
2. What full fine-tuning, linear-probing, and partial unfreezing each actually test/isolate, and why comparing them is more informative than reporting one number
3. What a confusion matrix reveals that a single accuracy number doesn't, and its limits (why you also need to look at actual misclassified examples, not just the matrix)
4. Perplexity as an evaluation metric for a trained language model — what it measures and why held-out (not training) perplexity is the meaningful number
5. Self-BLEU and distinct-n as measures of sample diversity — what problem they're meant to catch (e.g. degenerate/repetitive generation) that perplexity alone can miss
6. Decoding-strategy tradeoffs (greedy vs. temperature vs. top-k vs. top-p) and why "just take the argmax" isn't the default choice in practice
7. Recall@k and MRR as retrieval evaluation metrics — what each measures and how they differ
8. Why a stretch goal is explicitly optional/secondary to the core deliverables, and how to scope a ~1-2 week part-time project realistically
9. What attention-rollout/Grad-CAM-style visualization adds to error analysis beyond a confusion matrix
10. Why an open-ended capstone still benefits from an explicit "how you'll know it worked" evaluation plan defined before you start building, not just implementation

- [ ] **Step 2: Verify**

Run: `ruby -ryaml -e "puts YAML.load_file('_data/quizzes/13_capstone.yml').length"` — expect 8-10.

Run: `node --test test/quiz-data.test.mjs` — expect all tests pass, including the new file's checks. Fix and re-run until green.

Manually tally the `answer_index` distribution across the file's MCQs and confirm genuine spread across all 4 positions (not just "not all identical") per this plan's Global Constraints.

Manually tally how many MCQs have the correct choice as the longest choice — confirm real margin below the ceiling (`ceil(N_mcq/2)`), not a boundary pass, per this plan's Global Constraints.

Run `bundle exec jekyll build` — expect no errors; spot-check the quiz renders with the right question count.

- [ ] **Step 3: Commit**

```bash
git add _data/quizzes/13_capstone.yml
git commit -m "Add Module 13 quiz data"
```

---

### Task 4: Whole-course final verification and deploy

**Files:**
- Modify: `README.md` (Course content status section)

This is the last task of the last module — verify the FULL course (all 13 modules), not just Module 13.

- [ ] **Step 1: Full local build**

Run: `bundle exec jekyll build` — expect no errors.

- [ ] **Step 2: Verify nav reachability for Module 13's three pages**

```bash
grep -o 'href="[^"]*13-capstone/*"' _site/index.html | sort -u
```
Expected: at least one real nav link. Also confirm via the built module page that both `reading.html` (Where to Go Next) and `project-brief.html` appear as children in the sidebar.

- [ ] **Step 3: Whole-course nav sanity check**

Confirm all 13 modules (01 through 13) are present and correctly ordered in the built nav:
```bash
grep -oE 'href="[^"]*modules/[0-9]{2}-[a-z-]+/*"' _site/index.html | sort -u
```
Expected: exactly 13 distinct module links, `01-dnn-refresher` through `13-capstone`, no duplicates or gaps.

- [ ] **Step 4: Update `README.md`'s Course content status section**

Read the current section first — it currently states every module "is fully built out: content page, reading list, quiz data, and a starter/solution notebook pair," which is no longer accurate for Module 13 (project-brief instead of notebooks). Update it to note Module 13's exception, e.g.:

```markdown
## Course content status

All 13 modules are complete. Modules 1-12 each have: content page, reading list, quiz data, and a
starter/solution notebook pair. Module 13 (Capstone) is project-based per the course design — it has
a content page, a "where to go next" pointer page, quiz data, and a project brief (three open-ended
project options plus alternatives) instead of a starter/solution notebook pair, since the work is a
self-directed 1-2 week project rather than a fill-in-the-stub exercise.
```

Adjust wording as needed but preserve the key facts: all 13 modules complete, Modules 1-12's structure, Module 13's structural exception and why.

- [ ] **Step 5: Run the full automated test suite**

Run: `node --test test/*.test.mjs` — expect all pass, including `quiz-data.test.mjs` covering all 13 quiz files now.

Run: `cd worker && npm test` — expect all pass (unaffected by this plan, confirm no regression).

- [ ] **Step 6: Verify Module 13's quiz and chat widget render**

Confirm (via the JSON-extraction approach, not a naive HTML grep — the site is minified single-line HTML: parse the `<script type="application/json" id="quiz-data-...">` block out of `_site/modules/13-capstone/index.html` and confirm it parses to 8-10 questions) and confirm `chat-widget-root` appears on the page.

- [ ] **Step 7: Commit the README update**

```bash
git add README.md
git commit -m "Update README: all 13 modules complete, document Module 13's project-brief structure"
```

- [ ] **Step 8: Push and confirm CI**

```bash
git push origin master
```
Poll `gh run list --limit 3` for the newly-triggered "Build and deploy Pages" run and watch it: `gh run watch <run-id> --exit-status`.
Expected: the Pages workflow succeeds. (The Worker deploy workflow will also trigger since it touches `modules/**`; its deploy step is gated to skip, not fail, when `CLOUDFLARE_API_TOKEN` isn't configured — this has consistently shown as a `failure`-labeled-but-0-second gated skip since Plan 2, not a real failure — expected, not a blocker.)

- [ ] **Step 9: Verify live**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/13-capstone/?cb=$(date +%s)"
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/13-capstone/project-brief.html?cb=$(date +%s)"
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/13-capstone/reading.html?cb=$(date +%s)"
```
Expected: all three `200`.

- [ ] **Step 10: Whole-course spot check**

As a final sanity pass since this is the last module of the whole course, spot-check 2-3 already-shipped modules are still live and unaffected:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/01-dnn-refresher/?cb=$(date +%s)"
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/07-rl-for-llms/?cb=$(date +%s)"
curl -s -o /dev/null -w "%{http_code}\n" "https://nsteve2407.github.io/llm-transformers-course/modules/12-clip/?cb=$(date +%s)"
```
Expected: all `200`.
