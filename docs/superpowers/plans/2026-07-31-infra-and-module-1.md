# Infrastructure & Module 1 Reference Implementation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full course site infrastructure (Jekyll + Just the Docs on GitHub Pages, quiz component, Cloudflare Worker chat proxy) and fully build out Module 1 (DNN Refresher) end-to-end as the reference implementation that Modules 2–13 will replicate.

**Architecture:** Static Jekyll site built by GitHub Actions and deployed to GitHub Pages from a public repo. Per-module content lives under `modules/<slug>/`. Quizzes are pure client-side JS driven by YAML data, no backend. A single Cloudflare Worker proxies chat requests to the Anthropic API, holding the API key server-side and grounding each conversation in that module's content. Coding exercises are paired Jupyter notebooks runnable in Colab.

**Tech Stack:** Jekyll (Ruby/Bundler) + Just the Docs theme, vanilla JS (ES modules), Node's built-in test runner (`node --test`), Cloudflare Workers + TypeScript + Vitest, PyTorch/Jupyter notebooks, GitHub Actions, `gh` CLI.

## Global Constraints

- Repo: public GitHub repo `llm-transformers-course`, owner `nsteve2407`, local path `/home/steve/Agent Lab/llm-transformers-course` (already `git init`'d with one commit containing the design spec).
- Site must build via GitHub Actions (`ruby/setup-ruby` + `bundle exec jekyll build` + `actions/upload-pages-artifact` + `actions/deploy-pages`), **not** the legacy GitHub-managed Jekyll build — Pages source must be set to "GitHub Actions".
- Coding exercises: PyTorch, paired `exercise_starter.ipynb` / `exercise_solution.ipynb` per module under `notebooks/<slug>/`, each with an "Open in Colab" badge pointing at `https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/main/notebooks/<slug>/<file>.ipynb`.
- Quizzes: client-side only, no backend, data-driven from `modules/<slug>/quiz.yml`, MCQ + short-answer with lenient keyword grading.
- Chat widget: a single Cloudflare Worker holds `ANTHROPIC_API_KEY` as a secret (never client-side, never committed), calls the Anthropic Messages API with model `claude-sonnet-5`, grounds each conversation with that module's own content, restricts CORS to the Pages origin, and rate-limits per IP via Workers KV.
- All reading-list URLs used in module content must be exactly the verified URLs already recorded in `docs/superpowers/specs/2026-07-31-llm-transformers-course-design.md` §4 — do not invent or guess new ones.
- Live end-to-end verification of the chat widget requires the user's own Cloudflare account and Anthropic API key (spec §9) — this plan wires everything so it works once those are supplied, but cannot fully verify the live call itself.

---

## File Structure

```
llm-transformers-course/
  Gemfile, Gemfile.lock, _config.yml, index.md, .gitignore, README.md
  _includes/quiz.html, _includes/chat-widget.html
  assets/js/quiz-logic.mjs, assets/js/quiz.js
  assets/js/chat-client.mjs, assets/js/chat-widget.js
  test/quiz-logic.test.mjs, test/chat-client.test.mjs
  modules/01-dnn-refresher/index.md, reading.md, quiz.yml
  notebooks/01-dnn-refresher/exercise_starter.ipynb, exercise_solution.ipynb
  scripts/build_chat_context.mjs
  worker/package.json, tsconfig.json, vitest.config.ts, wrangler.toml
  worker/src/index.ts, worker/src/rate-limit.ts
  worker/test/rate-limit.test.ts
  .github/workflows/pages.yml, worker-deploy.yml
```

---

### Task 1: Jekyll site skeleton (Just the Docs theme)

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Create: `index.md`
- Create: `.gitignore`

**Interfaces:**
- Produces: a `bundle exec jekyll build` command that later tasks (and CI) rely on to build the site into `_site/`.

- [ ] **Step 1: Write the Gemfile**

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3"
gem "just-the-docs", "~> 0.8"

group :jekyll_plugins do
  gem "jekyll-sitemap"
end

gem "webrick", "~> 1.8"
```

- [ ] **Step 2: Write `_config.yml`**

```yaml
title: LLM & Transformers Course
description: >-
  A comprehensive, self-paced course covering DNN/CNN/RNN foundations
  through modern text and vision Transformers, with reading lists,
  PyTorch coding exercises, and quizzes.
theme: just-the-docs
url: "https://nsteve2407.github.io"
baseurl: "/llm-transformers-course"

plugins:
  - jekyll-sitemap

nav_external_links:
  - title: GitHub Repo
    url: https://github.com/nsteve2407/llm-transformers-course

search_enabled: true
heading_anchors: true

aux_links:
  "View on GitHub":
    - "https://github.com/nsteve2407/llm-transformers-course"

back_to_top: true
back_to_top_text: "Back to top"

footer_content: "LLM & Transformers Course"

callouts:
  note:
    title: Note
    color: blue
  exercise:
    title: Coding Exercise
    color: green
```

- [ ] **Step 3: Write `index.md`**

```markdown
---
title: Home
layout: home
nav_order: 1
---

# LLM & Transformers Course

A comprehensive, self-paced course: refresh DNNs/CNNs, learn RNNs/LSTMs,
then go deep on Transformers for text (attention, the BERT/GPT/T5 lineage,
scaling, RL-based post-training, efficient inference) and vision (ViT,
Swin, DETR, CLIP), finishing with a capstone project.

Each module has: written content, a verified reading list, a PyTorch
coding exercise you can run in Colab, an interactive quiz, and an
embedded chat widget grounded in that module's material for asking
questions as you go.

## How to use this course

1. Read the module content and reading list.
2. Open the exercise notebook in Colab and work through the TODOs.
3. Take the quiz to check your understanding.
4. Use the "Ask a question" box on the page if anything is unclear.

## Modules

See the sidebar for the full module list, starting with **Module 1: DNN Refresher**.
```

- [ ] **Step 4: Write `.gitignore`**

```
_site/
.jekyll-cache/
.jekyll-metadata
.bundle/
vendor/
Gemfile.lock.bak

node_modules/
worker/node_modules/
worker/dist/
worker/src/context/*.json
!worker/src/context/.gitkeep

.DS_Store
```

- [ ] **Step 5: Install and build**

Run: `cd "/home/steve/Agent Lab/llm-transformers-course" && bundle install`
Expected: gems install cleanly, `Gemfile.lock` is generated.

Run: `bundle exec jekyll build`
Expected: `Configuration file: .../_config.yml` then `done in X seconds`, and `_site/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add Gemfile Gemfile.lock _config.yml index.md .gitignore
git commit -m "Add Jekyll site skeleton with Just the Docs theme"
```

---

### Task 2: Create the GitHub repo and enable Pages (GitHub Actions source)

**Files:** none (uses `gh` CLI; repo already has local commits from Task 1 and the earlier spec commit)

**Interfaces:**
- Produces: a `github.com/nsteve2407/llm-transformers-course` public repo with `origin` remote configured, and Pages configured with `build_type=workflow` so the Task 3 workflow can deploy to it.

- [ ] **Step 1: Create the repo from the existing local git history and push**

Run:
```bash
cd "/home/steve/Agent Lab/llm-transformers-course"
gh repo create llm-transformers-course --public --source=. --remote=origin --push
```
Expected: output confirms repo creation and a successful push of `master` (or `main`) to `origin`.

- [ ] **Step 2: Verify the repo exists and check the default branch name**

Run: `gh repo view nsteve2407/llm-transformers-course --json defaultBranchRef --jq .defaultBranchRef.name`
Expected: prints the branch name (e.g. `master` or `main`) — record it, it's needed for Task 3's workflow trigger.

- [ ] **Step 3: Enable Pages with GitHub Actions as the build source**

Run: `gh api -X POST repos/nsteve2407/llm-transformers-course/pages -f "build_type=workflow"`
Expected: JSON response with `"build_type": "workflow"`. If Pages was never enabled before this may 404 until the first Actions deploy runs — in that case, proceed to Task 3 and return here to confirm afterward with:
`gh api repos/nsteve2407/llm-transformers-course/pages --jq .build_type`
Expected: `workflow`

---

### Task 3: GitHub Actions Pages build & deploy workflow

**Files:**
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `bundle exec jekyll build` from Task 1.
- Produces: a live site at `https://nsteve2407.github.io/llm-transformers-course/`.

- [ ] **Step 1: Write the workflow**

```yaml
name: Build and deploy Pages

on:
  push:
    branches: [master]
    paths:
      - "_config.yml"
      - "Gemfile"
      - "Gemfile.lock"
      - "index.md"
      - "modules/**"
      - "_includes/**"
      - "assets/**"
      - ".github/workflows/pages.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.2"
          bundler-cache: true
      - name: Build with Jekyll
        run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
      - id: pages
        uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: "_site"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Note: if Task 2 Step 2 found the default branch is `main` instead of `master`, change `branches: [master]` to `branches: [main]` before committing.

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/pages.yml
git commit -m "Add GitHub Actions workflow to build and deploy Pages"
git push origin master
```

- [ ] **Step 3: Watch the run and verify it succeeds**

Run: `gh run watch --exit-status`
Expected: both `build` and `deploy` jobs complete successfully (exit status 0).

- [ ] **Step 4: Verify Pages is now on the Actions build type, and the site is live**

Run: `gh api repos/nsteve2407/llm-transformers-course/pages --jq '{build_type, html_url}'`
Expected: `{"build_type": "workflow", "html_url": "https://nsteve2407.github.io/llm-transformers-course/"}`

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://nsteve2407.github.io/llm-transformers-course/`
Expected: `200`

---

### Task 4: Quiz grading logic (pure module, unit tested)

**Files:**
- Create: `assets/js/quiz-logic.mjs`
- Test: `test/quiz-logic.test.mjs`

**Interfaces:**
- Produces: `gradeMCQ(question, selectedIndex) -> boolean`, `gradeShortAnswer(question, userText) -> boolean`, `scoreQuiz(questions, responses) -> {correctCount, total, results}` where `results` is `Array<{question, correct, explanation}>`. Task 5 imports these three functions by name.
- Question shape: `{type: "mcq", question, choices: string[], answer_index: number, explanation}` or `{type: "short", question, answer_keywords: string[], model_answer, explanation}`.

- [ ] **Step 1: Write the failing test**

```javascript
// test/quiz-logic.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeMCQ, gradeShortAnswer, scoreQuiz } from "../assets/js/quiz-logic.mjs";

test("gradeMCQ returns true for the correct index", () => {
  const q = { type: "mcq", choices: ["a", "b", "c"], answer_index: 1 };
  assert.equal(gradeMCQ(q, 1), true);
  assert.equal(gradeMCQ(q, 0), false);
});

test("gradeShortAnswer matches on any keyword, case- and punctuation-insensitive", () => {
  const q = { type: "short", answer_keywords: ["adam", "adaptive moment"] };
  assert.equal(gradeShortAnswer(q, "It uses Adam!"), true);
  assert.equal(gradeShortAnswer(q, "adaptive-moment estimation"), true);
  assert.equal(gradeShortAnswer(q, "plain SGD"), false);
});

test("scoreQuiz tallies correct answers across mixed question types", () => {
  const questions = [
    { type: "mcq", choices: ["a", "b"], answer_index: 0, explanation: "e1" },
    { type: "short", answer_keywords: ["dropout"], explanation: "e2" },
  ];
  const responses = [0, "we use dropout here"];
  const result = scoreQuiz(questions, responses);
  assert.equal(result.correctCount, 2);
  assert.equal(result.total, 2);
  assert.equal(result.results[0].correct, true);
  assert.equal(result.results[1].correct, true);
});

test("scoreQuiz records incorrect answers too", () => {
  const questions = [{ type: "mcq", choices: ["a", "b"], answer_index: 0, explanation: "e1" }];
  const result = scoreQuiz(questions, [1]);
  assert.equal(result.correctCount, 0);
  assert.equal(result.results[0].correct, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/quiz-logic.test.mjs`
Expected: FAIL — `Cannot find module '../assets/js/quiz-logic.mjs'`

- [ ] **Step 3: Write the implementation**

```javascript
// assets/js/quiz-logic.mjs
export function gradeMCQ(question, selectedIndex) {
  return selectedIndex === question.answer_index;
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
}

export function gradeShortAnswer(question, userText) {
  const normalized = normalize(userText);
  return question.answer_keywords.some((keyword) =>
    normalized.includes(normalize(keyword))
  );
}

export function scoreQuiz(questions, responses) {
  const results = questions.map((question, i) => {
    const correct =
      question.type === "mcq"
        ? gradeMCQ(question, responses[i])
        : gradeShortAnswer(question, responses[i] ?? "");
    return { question, correct, explanation: question.explanation };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { correctCount, total: questions.length, results };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/quiz-logic.test.mjs`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add assets/js/quiz-logic.mjs test/quiz-logic.test.mjs
git commit -m "Add quiz grading logic with unit tests"
```

---

### Task 5: Quiz Jekyll include + DOM rendering

**Files:**
- Create: `_includes/quiz.html`
- Create: `assets/js/quiz.js`

**Interfaces:**
- Consumes: `gradeMCQ`, `gradeShortAnswer`, `scoreQuiz` from `assets/js/quiz-logic.mjs` (Task 4), and a page-level YAML file loaded via Liquid (`site.data` is not used — each module's `quiz.yml` is read directly via Jekyll's `| jsonify` on data included in front matter, see Task 7).
- Produces: a `<div id="quiz-root" data-module="{{ include.slug }}"></div>` block that any module page can embed with `{% include quiz.html slug=page.slug quiz=page.quiz %}`.

This isn't unit-testable without a headless browser, so verification is manual via `jekyll serve` once Module 1's quiz data exists (Task 7).

- [ ] **Step 1: Write the include**

```html
<!-- _includes/quiz.html -->
<section id="quiz-root" data-module="{{ include.slug }}">
  <h2>Check your understanding</h2>
  <script type="application/json" id="quiz-data">
    {{ include.quiz | jsonify }}
  </script>
  <div id="quiz-app"></div>
</section>
<script type="module" src="{{ '/assets/js/quiz.js' | relative_url }}"></script>
```

- [ ] **Step 2: Write the DOM wiring**

```javascript
// assets/js/quiz.js
import { scoreQuiz } from "./quiz-logic.mjs";

function renderQuestion(question, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-question";
  wrapper.innerHTML = `<p><strong>Q${index + 1}.</strong> ${question.question}</p>`;

  if (question.type === "mcq") {
    question.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.innerHTML = `<input type="radio" name="q${index}" value="${choiceIndex}"> ${choice}`;
      wrapper.appendChild(label);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.name = `q${index}`;
    input.placeholder = "Your answer";
    wrapper.appendChild(input);
  }

  const feedback = document.createElement("p");
  feedback.className = "quiz-feedback";
  feedback.dataset.index = index;
  wrapper.appendChild(feedback);

  return wrapper;
}

function collectResponse(question, index) {
  if (question.type === "mcq") {
    const checked = document.querySelector(`input[name="q${index}"]:checked`);
    return checked ? Number(checked.value) : null;
  }
  const input = document.querySelector(`input[name="q${index}"]`);
  return input ? input.value : "";
}

function init() {
  const dataEl = document.getElementById("quiz-data");
  if (!dataEl) return;
  const questions = JSON.parse(dataEl.textContent);
  const app = document.getElementById("quiz-app");

  questions.forEach((q, i) => app.appendChild(renderQuestion(q, i)));

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit answers";
  const scoreEl = document.createElement("p");
  scoreEl.className = "quiz-score";
  app.appendChild(submitBtn);
  app.appendChild(scoreEl);

  submitBtn.addEventListener("click", () => {
    const responses = questions.map((q, i) => collectResponse(q, i));
    const { correctCount, total, results } = scoreQuiz(questions, responses);
    scoreEl.textContent = `Score: ${correctCount} / ${total}`;
    results.forEach((r, i) => {
      const feedback = document.querySelector(`.quiz-feedback[data-index="${i}"]`);
      feedback.textContent = r.correct
        ? "Correct."
        : `Incorrect. ${r.explanation}`;
      feedback.style.color = r.correct ? "green" : "crimson";
    });
  });
}

init();
```

- [ ] **Step 3: Commit**

```bash
git add _includes/quiz.html assets/js/quiz.js
git commit -m "Add quiz Jekyll include and DOM rendering"
```

---

### Task 6: Module 1 content pages (index.md + reading.md)

**Files:**
- Create: `modules/01-dnn-refresher/index.md`
- Create: `modules/01-dnn-refresher/reading.md`

**Interfaces:**
- Produces: the page that Task 7 (quiz) and Task 13 (chat widget) embed into via `{% include %}`.

- [ ] **Step 1: Write `modules/01-dnn-refresher/index.md`**

```markdown
---
title: "1. DNN Refresher"
parent: Modules
nav_order: 1
slug: 01-dnn-refresher
has_children: false
---

# Module 1: DNN Refresher

MLPs, backpropagation, optimization (SGD/Adam), regularization, initialization.

## Subtopics

- MLP forward pass mechanics: affine transforms, activation functions, and how depth/width shape the function class the network can represent
- Computational graphs and reverse-mode automatic differentiation, and why reverse mode is efficient for scalar-loss/many-parameter functions
- Full derivation of backpropagation for an MLP: local gradients per layer, the delta/error-signal recursion, generalizing to matrix weights and batched inputs
- Vanishing/exploding gradients in deep nets from repeated multiplication of Jacobians with depth
- Xavier/Glorot vs. He initialization — deriving the variance-scaling constants
- SGD variants: momentum, Nesterov's look-ahead gradient evaluation
- Adam/RMSprop internals: moment estimates, bias-correction, and why it matters early in training
- Why L2 regularization and true weight decay diverge under Adam (the AdamW motivation)
- Learning rate schedules: step decay, cosine annealing, warmup
- Dropout mechanics: train-time random masking, inverted dropout scaling
- Batch normalization: train-time batch stats vs. inference-time running stats, learnable γ/β
- Cross-entropy + softmax numerical stability (the log-sum-exp trick)

## Reading list

See [Module 1 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"MLP from scratch, then scale up"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/01-dnn-refresher/exercise_starter.ipynb){:target="_blank"}.

Part A: implement a 2-layer MLP for MNIST using raw tensor ops only — forward pass, manual backward pass, plain SGD, no `.backward()` — and verify against autograd. Part B: reimplement with autograd, train with SGD / SGD+momentum / Adam / AdamW vs. Adam+L2, and plot the AdamW/Adam+L2 divergence. Part C: add Dropout + BatchNorm and demonstrate train vs. eval-mode behavior.

{% include quiz.html slug=page.slug quiz=site.data.quizzes["01_dnn_refresher"] %}

{% include chat-widget.html slug=page.slug title=page.title %}
```

Note: Jekyll turns `_data/quizzes/01_dnn_refresher.yml` (created in Task 7) into `site.data.quizzes["01_dnn_refresher"]` — a bracket lookup, not a dotted identifier, since the filename starts with a digit.

- [ ] **Step 2: Write `modules/01-dnn-refresher/reading.md`**

```markdown
---
title: "Reading List"
parent: "1. DNN Refresher"
nav_order: 1
---

# Module 1 Reading List

## Required

- Kingma & Ba (2014). *Adam: A Method for Stochastic Optimization.* <https://arxiv.org/abs/1412.6980>
- Ioffe & Szegedy (2015). *Batch Normalization.* <https://arxiv.org/abs/1502.03167>
- Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov (2014). *Dropout.* <https://jmlr.org/papers/v15/srivastava14a.html>
- He, Zhang, Ren, Sun (2015). *Delving Deep into Rectifiers.* <https://arxiv.org/abs/1502.01852>
- Glorot & Bengio (2010). *Understanding the difficulty of training deep feedforward neural networks.* <https://proceedings.mlr.press/v9/glorot10a.html>
- Loshchilov & Hutter (2017/2019). *Decoupled Weight Decay Regularization (AdamW).* <https://arxiv.org/abs/1711.05101>

## Optional / further reading

- Goh (2017). *Why Momentum Really Works.* Distill. <https://distill.pub/2017/momentum/>
- Ruder (2016). *An overview of gradient descent optimization algorithms.* <https://www.ruder.io/optimizing-gradient-descent/>
- Santurkar, Tsipras, Ilyas, Madry (2018). *How Does Batch Normalization Help Optimization?* <https://arxiv.org/abs/1805.11604>
- Stanford CS231n, *Backpropagation, Intuitions.* <https://cs231n.github.io/optimization-2/>

## Lecture references

- Stanford CS231n, *Neural Networks Part 2.* <https://cs231n.github.io/neural-networks-2/>
- Stanford CS231n, *Neural Networks Part 3.* <https://cs231n.github.io/neural-networks-3/>
```

- [ ] **Step 3: Verify locally**

Run: `bundle exec jekyll build`
Expected: no errors; `_site/modules/01-dnn-refresher/index.html` and `.../reading/index.html` exist.

- [ ] **Step 4: Commit**

```bash
git add modules/01-dnn-refresher/index.md modules/01-dnn-refresher/reading.md
git commit -m "Add Module 1 content and reading list pages"
```

---

### Task 7: Module 1 quiz data

**Files:**
- Create: `_data/quizzes/01_dnn_refresher.yml`

**Interfaces:**
- Consumes: the question schema from Task 4/5.
- Produces: `site.data.quizzes.01_dnn_refresher` (referenced from `modules/01-dnn-refresher/index.md` as `site.data.quizzes_01_dnn_refresher` — note: Jekyll nests `_data/quizzes/01_dnn_refresher.yml` under `site.data.quizzes["01_dnn_refresher"]`; fix the include reference in this task's Step 2 to use the correct path).

- [ ] **Step 1: Write the quiz data file**

```yaml
# _data/quizzes/01_dnn_refresher.yml
- type: mcq
  question: "In backprop, why do we prefer reverse-mode over forward-mode autodiff for training a neural network?"
  choices:
    - "Forward mode doesn't support nonlinear activations"
    - "Reverse mode is efficient when there are many parameters and a single scalar loss output"
    - "Reverse mode uses less memory in all cases"
    - "Forward mode can't compute exact gradients"
  answer_index: 1
  explanation: "Reverse mode computes all parameter gradients in one backward pass, which is efficient exactly when outputs (loss) are few and inputs (parameters) are many — the opposite of forward mode's sweet spot."

- type: mcq
  question: "Why does AdamW's decoupled weight decay behave differently from adding an L2 penalty directly to the loss under Adam?"
  choices:
    - "They are mathematically identical, AdamW is just a naming convention"
    - "L2's gradient contribution gets rescaled by Adam's adaptive per-parameter learning rate, while true weight decay does not"
    - "AdamW only works with convolutional layers"
    - "L2 regularization is always stronger than weight decay"
  answer_index: 1
  explanation: "Under Adam, an L2 penalty added to the loss gets divided by each parameter's adaptive step size, so parameters with large gradient history are decayed less. AdamW instead subtracts a decay term directly from the weights, independent of the adaptive scaling."

- type: mcq
  question: "What does He initialization account for that Xavier/Glorot initialization does not?"
  choices:
    - "The use of batch normalization"
    - "ReLU zeroing out roughly half of its inputs, requiring a larger variance to compensate"
    - "The number of training epochs"
    - "The choice of optimizer"
  answer_index: 1
  explanation: "Xavier initialization assumes symmetric activations like tanh. ReLU zeros out negative inputs, halving the effective variance, so He initialization scales the variance up to compensate."

- type: short
  question: "What numerical trick keeps softmax + cross-entropy stable when logits are very large or very negative?"
  answer_keywords:
    - "log-sum-exp"
    - "logsumexp"
    - "subtract the max"
    - "max logit"
  model_answer: "The log-sum-exp trick: subtract the maximum logit before exponentiating, which avoids overflow while leaving the softmax output mathematically unchanged."
  explanation: "Subtracting the max logit (or using a fused log-sum-exp implementation) prevents exp() from overflowing while producing an identical result, since softmax is invariant to a constant shift in the logits."

- type: mcq
  question: "What does 'inverted dropout' scale, and when?"
  choices:
    - "It scales the loss by the dropout rate at test time"
    - "It scales surviving activations by 1/keep_prob at train time, so no scaling is needed at inference"
    - "It scales the learning rate during training"
    - "It scales the weights only during the first epoch"
  answer_index: 1
  explanation: "Inverted dropout divides the kept activations by keep_prob during training, so the expected activation magnitude matches inference time exactly, and no rescaling is needed when dropout is turned off for evaluation."

- type: mcq
  question: "During training, what statistics does BatchNorm use to normalize activations, and what does it use at inference time?"
  choices:
    - "Always the running average, both at train and inference time"
    - "The current mini-batch's mean/variance at train time; a running (exponential moving average) mean/variance at inference time"
    - "A fixed mean of 0 and variance of 1 at all times"
    - "The mean/variance of the entire training set, recomputed every batch"
  answer_index: 1
  explanation: "BatchNorm normalizes using the current mini-batch's statistics during training (which introduces useful noise/regularization) and switches to accumulated running statistics at inference, so a single example can be normalized without needing a batch."

- type: short
  question: "Why does Nesterov momentum evaluate the gradient at a 'look-ahead' point rather than at the current parameters?"
  answer_keywords:
    - "look-ahead"
    - "look ahead"
    - "future position"
    - "anticipat"
  model_answer: "It evaluates the gradient at the position the momentum term is already about to move to, giving a correction based on where the update is heading rather than where it currently is — this typically converges faster and dampens oscillation."
  explanation: "Nesterov momentum computes the gradient after applying the momentum step (the 'look-ahead' point), giving an anticipatory correction that classical (heavy-ball) momentum, which evaluates the gradient at the current point, doesn't have."

- type: mcq
  question: "Why is warmup particularly important for adaptive optimizers like Adam early in training?"
  choices:
    - "Warmup is only relevant for plain SGD"
    - "Adam's second-moment estimate is noisy/uninitialized early on, and large steps at that point can be unstable"
    - "Warmup prevents overfitting at the end of training"
    - "Warmup is required to enable dropout"
  answer_index: 1
  explanation: "Early in training, Adam's moving-average estimates of the gradient's second moment are based on very few samples and can be unreliable, producing overly large effective steps; warmup ramps the learning rate up gradually to avoid this instability."

- type: short
  question: "What is the core problem that causes vanishing or exploding gradients in very deep networks?"
  answer_keywords:
    - "repeated multiplication"
    - "product of jacobians"
    - "chain rule"
    - "depth"
  model_answer: "Backprop's chain rule multiplies many layers' Jacobians (weight matrices times activation derivatives) together; if their typical magnitude is consistently below 1 the product shrinks toward zero with depth (vanishing), and if consistently above 1 it grows unboundedly (exploding)."
  explanation: "The gradient at an early layer is a product of many per-layer Jacobians. Depending on whether their eigenvalues are systematically below or above 1, that product shrinks or grows exponentially with network depth."

- type: mcq
  question: "What does dropout do differently at evaluation time compared to training time (with inverted dropout)?"
  choices:
    - "Nothing changes, dropout is still applied identically"
    - "Dropout is disabled entirely and all units are used, unscaled"
    - "Dropout rate is doubled"
    - "Only the last layer uses dropout at eval time"
  answer_index: 1
  explanation: "At evaluation time, dropout is simply turned off — every unit is used, with no masking and no additional scaling, because inverted dropout already applied the 1/keep_prob correction during training."
```

- [ ] **Step 2: Verify the YAML parses and the page renders with 10 questions**

Run: `ruby -ryaml -e "puts YAML.load_file('_data/quizzes/01_dnn_refresher.yml').length"`
Expected: `10`

Run: `bundle exec jekyll serve --detach && sleep 2 && curl -s http://127.0.0.1:4000/llm-transformers-course/modules/01-dnn-refresher/ | grep -c 'quiz-question' ; bundle exec jekyll stop 2>/dev/null || pkill -f jekyll`
(Note: the `quiz-question` divs are created client-side by `quiz.js`, so this curl check only confirms the page and the embedded `quiz-data` JSON script tag are present — do a manual browser check too.)

Run: `bundle exec jekyll serve` and open `http://127.0.0.1:4000/llm-transformers-course/modules/01-dnn-refresher/` in a browser. Manually answer one question correctly and one incorrectly, click "Submit answers", and confirm: the score updates, the correct answer shows "Correct." in green, and the incorrect answer shows "Incorrect. <explanation>" in red — this satisfies the spec's quiz success criterion (§10: "Every quiz gives correct instant feedback for at least one right and one wrong answer").

- [ ] **Step 3: Commit**

```bash
git add _data/quizzes/01_dnn_refresher.yml modules/01-dnn-refresher/index.md
git commit -m "Add Module 1 quiz data and wire it into the module page"
```

---

### Task 8: Module 1 coding exercise notebooks

**Files:**
- Create: `notebooks/01-dnn-refresher/exercise_starter.ipynb`
- Create: `notebooks/01-dnn-refresher/exercise_solution.ipynb`

**Interfaces:**
- Produces: two runnable notebooks. Both support a `SMOKE_TEST` environment variable that, when set to `"1"`, swaps real MNIST for a tiny synthetic random dataset and reduces epochs to 1, so the notebook can be executed quickly and without network access as a correctness smoke test (real Colab runs leave `SMOKE_TEST` unset and use full MNIST).

- [ ] **Step 1: Write `exercise_solution.ipynb`**

```json
{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Module 1 Exercise (Solution): MLP from scratch, then scale up\n",
    "\n",
    "[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/01-dnn-refresher/exercise_solution.ipynb)\n",
    "\n",
    "Module page: [Module 1: DNN Refresher](https://nsteve2407.github.io/llm-transformers-course/modules/01-dnn-refresher/)\n",
    "\n",
    "**Part A**: implement a 2-layer MLP for MNIST using raw tensor ops only (manual forward + backward pass, no `.backward()`), and verify against autograd.\n",
    "\n",
    "**Part B**: reimplement with `nn.Module`/autograd, train with SGD / SGD+momentum / Adam / AdamW vs. Adam+L2, and compare loss curves.\n",
    "\n",
    "**Part C**: add Dropout + BatchNorm1d and demonstrate train vs. eval-mode behavior."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import os\n",
    "import torch\n",
    "import torch.nn.functional as F\n",
    "\n",
    "SMOKE_TEST = os.environ.get(\"SMOKE_TEST\") == \"1\"\n",
    "torch.manual_seed(0)\n",
    "device = \"cuda\" if torch.cuda.is_available() else \"cpu\"\n",
    "print(f\"SMOKE_TEST={SMOKE_TEST}, device={device}\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "if SMOKE_TEST:\n",
    "    X_train = torch.rand(256, 784)\n",
    "    y_train = torch.randint(0, 10, (256,))\n",
    "    X_val = torch.rand(64, 784)\n",
    "    y_val = torch.randint(0, 10, (64,))\n",
    "else:\n",
    "    from torchvision import datasets, transforms\n",
    "    tfm = transforms.Compose([transforms.ToTensor(), transforms.Lambda(lambda x: x.view(-1))])\n",
    "    train_ds = datasets.MNIST(root=\"./data\", train=True, download=True, transform=tfm)\n",
    "    val_ds = datasets.MNIST(root=\"./data\", train=False, download=True, transform=tfm)\n",
    "    X_train = torch.stack([train_ds[i][0] for i in range(len(train_ds))])\n",
    "    y_train = torch.tensor([train_ds[i][1] for i in range(len(train_ds))])\n",
    "    X_val = torch.stack([val_ds[i][0] for i in range(min(2000, len(val_ds)))])\n",
    "    y_val = torch.tensor([val_ds[i][1] for i in range(min(2000, len(val_ds)))])\n",
    "\n",
    "print(X_train.shape, y_train.shape)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": ["## Part A: manual forward + backward pass, verified against autograd"]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "def init_params(d_in=784, d_hidden=128, d_out=10, seed=0):\n",
    "    g = torch.Generator().manual_seed(seed)\n",
    "    W1 = torch.randn(d_in, d_hidden, generator=g) * (2.0 / d_in) ** 0.5\n",
    "    b1 = torch.zeros(d_hidden)\n",
    "    W2 = torch.randn(d_hidden, d_out, generator=g) * (2.0 / d_hidden) ** 0.5\n",
    "    b2 = torch.zeros(d_out)\n",
    "    return [W1, b1, W2, b2]\n",
    "\n",
    "\n",
    "def manual_forward(params, X):\n",
    "    W1, b1, W2, b2 = params\n",
    "    z1 = X @ W1 + b1\n",
    "    a1 = torch.relu(z1)\n",
    "    logits = a1 @ W2 + b2\n",
    "    cache = (X, z1, a1)\n",
    "    return logits, cache\n",
    "\n",
    "\n",
    "def manual_backward(params, cache, logits, y):\n",
    "    W1, b1, W2, b2 = params\n",
    "    X, z1, a1 = cache\n",
    "    n = X.shape[0]\n",
    "\n",
    "    probs = torch.softmax(logits, dim=1)\n",
    "    y_onehot = F.one_hot(y, num_classes=logits.shape[1]).float()\n",
    "    dlogits = (probs - y_onehot) / n  # combined softmax+CE gradient\n",
    "\n",
    "    dW2 = a1.T @ dlogits\n",
    "    db2 = dlogits.sum(dim=0)\n",
    "\n",
    "    da1 = dlogits @ W2.T\n",
    "    dz1 = da1 * (z1 > 0).float()  # ReLU gradient\n",
    "\n",
    "    dW1 = X.T @ dz1\n",
    "    db1 = dz1.sum(dim=0)\n",
    "\n",
    "    return [dW1, db1, dW2, db2]\n",
    "\n",
    "\n",
    "def cross_entropy_loss(logits, y):\n",
    "    return F.cross_entropy(logits, y)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Gradient check: compare manual gradients to autograd on a small batch\n",
    "params = init_params()\n",
    "X_batch, y_batch = X_train[:32], y_train[:32]\n",
    "\n",
    "autograd_params = [p.clone().requires_grad_(True) for p in params]\n",
    "logits_ag, _ = manual_forward(autograd_params, X_batch)\n",
    "loss_ag = cross_entropy_loss(logits_ag, y_batch)\n",
    "loss_ag.backward()\n",
    "autograd_grads = [p.grad for p in autograd_params]\n",
    "\n",
    "logits_manual, cache = manual_forward(params, X_batch)\n",
    "manual_grads = manual_backward(params, cache, logits_manual, y_batch)\n",
    "\n",
    "max_diffs = [(a - m).abs().max().item() for a, m in zip(autograd_grads, manual_grads)]\n",
    "print(\"Max abs diff per param (W1, b1, W2, b2):\", max_diffs)\n",
    "assert all(d < 1e-5 for d in max_diffs), \"Manual and autograd gradients diverge!\"\n",
    "print(\"Manual backprop matches autograd.\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Train the manual-backprop MLP with plain SGD\n",
    "params = init_params()\n",
    "lr = 0.5\n",
    "epochs = 1 if SMOKE_TEST else 5\n",
    "batch_size = 64\n",
    "\n",
    "for epoch in range(epochs):\n",
    "    perm = torch.randperm(X_train.shape[0])\n",
    "    total_loss = 0.0\n",
    "    for i in range(0, X_train.shape[0], batch_size):\n",
    "        idx = perm[i : i + batch_size]\n",
    "        Xb, yb = X_train[idx], y_train[idx]\n",
    "        logits, cache = manual_forward(params, Xb)\n",
    "        loss = cross_entropy_loss(logits, yb)\n",
    "        grads = manual_backward(params, cache, logits, yb)\n",
    "        with torch.no_grad():\n",
    "            for p, g in zip(params, grads):\n",
    "                p -= lr * g\n",
    "        total_loss += loss.item() * Xb.shape[0]\n",
    "    val_logits, _ = manual_forward(params, X_val)\n",
    "    val_acc = (val_logits.argmax(dim=1) == y_val).float().mean().item()\n",
    "    print(f\"epoch {epoch}: train_loss={total_loss / X_train.shape[0]:.4f} val_acc={val_acc:.4f}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": ["## Part B: autograd + optimizer comparison (SGD, SGD+momentum, Adam, AdamW vs. Adam+L2)"]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import torch.nn as nn\n",
    "\n",
    "\n",
    "class MLP(nn.Module):\n",
    "    def __init__(self, d_in=784, d_hidden=128, d_out=10):\n",
    "        super().__init__()\n",
    "        self.fc1 = nn.Linear(d_in, d_hidden)\n",
    "        self.fc2 = nn.Linear(d_hidden, d_out)\n",
    "\n",
    "    def forward(self, x):\n",
    "        return self.fc2(torch.relu(self.fc1(x)))\n",
    "\n",
    "\n",
    "def make_optimizer(name, model):\n",
    "    if name == \"sgd\":\n",
    "        return torch.optim.SGD(model.parameters(), lr=0.1)\n",
    "    if name == \"sgd_momentum\":\n",
    "        return torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)\n",
    "    if name == \"adam\":\n",
    "        return torch.optim.Adam(model.parameters(), lr=1e-3)\n",
    "    if name == \"adam_l2\":\n",
    "        return torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=0.01)\n",
    "    if name == \"adamw\":\n",
    "        return torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)\n",
    "    raise ValueError(name)\n",
    "\n",
    "\n",
    "def train_variant(name, epochs):\n",
    "    torch.manual_seed(0)\n",
    "    model = MLP().to(device)\n",
    "    opt = make_optimizer(name, model)\n",
    "    losses = []\n",
    "    for epoch in range(epochs):\n",
    "        perm = torch.randperm(X_train.shape[0])\n",
    "        total_loss = 0.0\n",
    "        for i in range(0, X_train.shape[0], batch_size):\n",
    "            idx = perm[i : i + batch_size]\n",
    "            Xb, yb = X_train[idx].to(device), y_train[idx].to(device)\n",
    "            opt.zero_grad()\n",
    "            loss = F.cross_entropy(model(Xb), yb)\n",
    "            loss.backward()\n",
    "            opt.step()\n",
    "            total_loss += loss.item() * Xb.shape[0]\n",
    "        losses.append(total_loss / X_train.shape[0])\n",
    "    return losses\n",
    "\n",
    "\n",
    "epochs_b = 1 if SMOKE_TEST else 5\n",
    "curves = {name: train_variant(name, epochs_b) for name in [\"sgd\", \"sgd_momentum\", \"adam\", \"adam_l2\", \"adamw\"]}\n",
    "for name, losses in curves.items():\n",
    "    print(name, [round(l, 4) for l in losses])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import matplotlib.pyplot as plt\n",
    "\n",
    "for name, losses in curves.items():\n",
    "    plt.plot(losses, label=name)\n",
    "plt.xlabel(\"epoch\")\n",
    "plt.ylabel(\"train loss\")\n",
    "plt.legend()\n",
    "plt.title(\"Optimizer comparison, incl. Adam+L2 vs AdamW\")\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": ["## Part C: Dropout + BatchNorm1d, train vs. eval mode"]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "class RegularizedMLP(nn.Module):\n",
    "    def __init__(self, d_in=784, d_hidden=128, d_out=10, p=0.5):\n",
    "        super().__init__()\n",
    "        self.fc1 = nn.Linear(d_in, d_hidden)\n",
    "        self.bn1 = nn.BatchNorm1d(d_hidden)\n",
    "        self.dropout = nn.Dropout(p)\n",
    "        self.fc2 = nn.Linear(d_hidden, d_out)\n",
    "\n",
    "    def forward(self, x):\n",
    "        x = torch.relu(self.bn1(self.fc1(x)))\n",
    "        x = self.dropout(x)\n",
    "        return self.fc2(x)\n",
    "\n",
    "\n",
    "reg_model = RegularizedMLP().to(device)\n",
    "x_probe = X_train[:8].to(device)\n",
    "\n",
    "reg_model.train()\n",
    "out_train_1 = reg_model(x_probe)\n",
    "out_train_2 = reg_model(x_probe)\n",
    "print(\"Train mode is stochastic (outputs differ):\", not torch.allclose(out_train_1, out_train_2))\n",
    "\n",
    "reg_model.eval()\n",
    "out_eval_1 = reg_model(x_probe)\n",
    "out_eval_2 = reg_model(x_probe)\n",
    "print(\"Eval mode is deterministic (outputs match):\", torch.allclose(out_eval_1, out_eval_2))"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
  "language_info": {"name": "python", "version": "3.11"}
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
```

- [ ] **Step 2: Write `exercise_starter.ipynb`**

Same structure as the solution, but with the implementation bodies of `manual_forward`, `manual_backward`, `MLP.forward`, and `RegularizedMLP.forward` replaced with `raise NotImplementedError("TODO: implement this")`, and the markdown header changed to "Module 1 Exercise: MLP from scratch, then scale up" (no "(Solution)") pointing its Colab badge at `exercise_starter.ipynb`. Concretely, replace this cell's `source` in the starter version:

```json
{
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "def init_params(d_in=784, d_hidden=128, d_out=10, seed=0):\n",
    "    g = torch.Generator().manual_seed(seed)\n",
    "    W1 = torch.randn(d_in, d_hidden, generator=g) * (2.0 / d_in) ** 0.5\n",
    "    b1 = torch.zeros(d_hidden)\n",
    "    W2 = torch.randn(d_hidden, d_out, generator=g) * (2.0 / d_hidden) ** 0.5\n",
    "    b2 = torch.zeros(d_out)\n",
    "    return [W1, b1, W2, b2]\n",
    "\n",
    "\n",
    "def manual_forward(params, X):\n",
    "    # TODO: compute z1 = X @ W1 + b1, a1 = relu(z1), logits = a1 @ W2 + b2\n",
    "    # Return logits and a cache of (X, z1, a1) needed for the backward pass.\n",
    "    raise NotImplementedError(\"TODO: implement manual_forward\")\n",
    "\n",
    "\n",
    "def manual_backward(params, cache, logits, y):\n",
    "    # TODO: derive dlogits from softmax(logits) - one_hot(y), divided by batch size,\n",
    "    # then backprop through fc2, ReLU, and fc1 to get dW1, db1, dW2, db2.\n",
    "    raise NotImplementedError(\"TODO: implement manual_backward\")\n",
    "\n",
    "\n",
    "def cross_entropy_loss(logits, y):\n",
    "    return F.cross_entropy(logits, y)"
   ]
}
```

and similarly stub the `MLP.forward` body (`raise NotImplementedError("TODO: implement the two-layer forward pass")`) and `RegularizedMLP.forward` body (`raise NotImplementedError("TODO: implement fc1 -> bn1 -> relu -> dropout -> fc2")`) in the starter notebook, keeping every other cell (data loading, gradient-check assertions, training loop, plotting) identical so the learner's implementation is exercised by the same harness.

- [ ] **Step 3: Smoke-test both notebooks execute without error**

Run:
```bash
cd "/home/steve/Agent Lab/llm-transformers-course"
SMOKE_TEST=1 jupyter nbconvert --to notebook --execute --output /tmp/solution_out.ipynb notebooks/01-dnn-refresher/exercise_solution.ipynb
```
Expected: exit code 0, no cell errors (the solution notebook runs end-to-end on synthetic data in under a minute).

Run: `SMOKE_TEST=1 jupyter nbconvert --to notebook --execute --output /tmp/starter_out.ipynb notebooks/01-dnn-refresher/exercise_starter.ipynb`
Expected: FAILS with `NotImplementedError` — this is correct, it confirms the starter's TODOs are wired into the same execution path the solution uses (a starter notebook that silently "passed" would mean the TODO stubs aren't actually being exercised).

- [ ] **Step 4: Commit**

```bash
git add notebooks/01-dnn-refresher/exercise_starter.ipynb notebooks/01-dnn-refresher/exercise_solution.ipynb
git commit -m "Add Module 1 coding exercise notebooks (starter + solution)"
```

---

### Task 9: Worker rate-limit logic (pure, unit tested)

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/vitest.config.ts`
- Create: `worker/src/rate-limit.ts`
- Test: `worker/test/rate-limit.test.ts`

**Interfaces:**
- Produces: `decideRateLimit(record: RateLimitRecord | null, now: number, limit: number, windowSeconds: number): { allowed: boolean; record: RateLimitRecord }` where `RateLimitRecord = { count: number; resetAt: number }`. Task 12 wraps this with real KV I/O.

- [ ] **Step 1: Write `worker/package.json`**

```json
{
  "name": "llm-course-chat-worker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "wrangler": "^3.70.0"
  }
}
```

- [ ] **Step 2: Write `worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `worker/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the failing test**

```typescript
// worker/test/rate-limit.test.ts
import { describe, it, expect } from "vitest";
import { decideRateLimit } from "../src/rate-limit";

describe("decideRateLimit", () => {
  it("allows the first request and starts a new window", () => {
    const result = decideRateLimit(null, 1000, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(1);
    expect(result.record.resetAt).toBe(1000 + 3600);
  });

  it("allows requests under the limit within the same window", () => {
    const existing = { count: 5, resetAt: 5000 };
    const result = decideRateLimit(existing, 1200, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(6);
    expect(result.record.resetAt).toBe(5000);
  });

  it("denies requests once the limit is reached within the window", () => {
    const existing = { count: 20, resetAt: 5000 };
    const result = decideRateLimit(existing, 1200, 20, 3600);
    expect(result.allowed).toBe(false);
    expect(result.record.count).toBe(20);
  });

  it("resets the window once resetAt has passed", () => {
    const existing = { count: 20, resetAt: 1000 };
    const result = decideRateLimit(existing, 1500, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(1);
    expect(result.record.resetAt).toBe(1500 + 3600);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd worker && npm install && npm test`
Expected: FAIL — `Cannot find module '../src/rate-limit'`

- [ ] **Step 6: Write the implementation**

```typescript
// worker/src/rate-limit.ts
export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  record: RateLimitRecord;
}

export function decideRateLimit(
  existing: RateLimitRecord | null,
  now: number,
  limit: number,
  windowSeconds: number
): RateLimitDecision {
  const isExpired = !existing || now >= existing.resetAt;

  if (isExpired) {
    return { allowed: true, record: { count: 1, resetAt: now + windowSeconds } };
  }

  if (existing.count >= limit) {
    return { allowed: false, record: existing };
  }

  return {
    allowed: true,
    record: { count: existing.count + 1, resetAt: existing.resetAt },
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test` (from `worker/`)
Expected: all 4 tests pass.

- [ ] **Step 8: Commit**

```bash
cd "/home/steve/Agent Lab/llm-transformers-course"
git add worker/package.json worker/tsconfig.json worker/vitest.config.ts worker/src/rate-limit.ts worker/test/rate-limit.test.ts
git commit -m "Add Worker rate-limit logic with unit tests"
```

---

### Task 10: Chat context generation script

**Files:**
- Create: `scripts/build_chat_context.mjs`
- Create: `worker/src/context/.gitkeep`

**Interfaces:**
- Produces: `worker/src/context/modules.json` mapping `{ [slug]: { title: string, content: string } }`, consumed by Task 12's `worker/src/index.ts` via a direct JSON import.

- [ ] **Step 1: Write the script**

```javascript
// scripts/build_chat_context.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const modulesDir = join(repoRoot, "modules");
const outDir = join(repoRoot, "worker", "src", "context");
const outFile = join(outDir, "modules.json");

function stripFrontMatterAndLiquid(raw) {
  const withoutFrontMatter = raw.replace(/^---[\s\S]*?---\n/, "");
  return withoutFrontMatter
    .replace(/{%[\s\S]*?%}/g, "")
    .replace(/{{[\s\S]*?}}/g, "")
    .trim();
}

function extractTitle(raw) {
  const match = raw.match(/^title:\s*"?(.*?)"?\s*$/m);
  return match ? match[1] : "Untitled Module";
}

function buildContext() {
  const context = {};
  const slugs = readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const slug of slugs) {
    const indexPath = join(modulesDir, slug, "index.md");
    const raw = readFileSync(indexPath, "utf-8");
    context[slug] = {
      title: extractTitle(raw),
      content: stripFrontMatterAndLiquid(raw),
    };
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(context, null, 2));
  console.log(`Wrote context for ${slugs.length} module(s) to ${outFile}`);
}

buildContext();
```

- [ ] **Step 2: Run it and verify output**

Run: `node scripts/build_chat_context.mjs`
Expected: `Wrote context for 1 module(s) to .../worker/src/context/modules.json`

Run: `node -e "const c = JSON.parse(require('fs').readFileSync('worker/src/context/modules.json')); console.log(Object.keys(c)); console.log(c['01-dnn-refresher'].title);"`
Expected: `[ '01-dnn-refresher' ]` and `1. DNN Refresher`

- [ ] **Step 3: Commit**

Note: `worker/src/context/modules.json` is gitignored per Task 1's `.gitignore` (it's generated, and will be regenerated by CI before each Worker deploy in Task 14) — only the script and the `.gitkeep` placeholder are committed.

```bash
git add scripts/build_chat_context.mjs worker/src/context/.gitkeep
git commit -m "Add chat context generation script"
```

---

### Task 11: Cloudflare Worker chat handler

**Files:**
- Create: `worker/src/index.ts`
- Create: `worker/wrangler.toml`

**Interfaces:**
- Consumes: `decideRateLimit` from `worker/src/rate-limit.ts` (Task 9), `worker/src/context/modules.json` (Task 10, generated at build time).
- Produces: a `fetch(request, env)` handler exported as the Worker's default export.

- [ ] **Step 1: Write `worker/wrangler.toml`**

```toml
name = "llm-course-chat"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[vars]
ALLOWED_ORIGIN = "https://nsteve2407.github.io"
RATE_LIMIT_PER_HOUR = "20"

# Create with: wrangler kv namespace create RATE_LIMIT_KV
# then paste the returned id below.
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

- [ ] **Step 2: Write `worker/src/index.ts`**

```typescript
// worker/src/index.ts
import modulesContext from "./context/modules.json";
import { decideRateLimit, type RateLimitRecord } from "./rate-limit";

interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_PER_HOUR: string;
  RATE_LIMIT_KV: KVNamespace;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  module: string;
  messages: ChatMessage[];
}

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const MAX_HISTORY_TURNS = 6;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const existing: RateLimitRecord | null = raw ? JSON.parse(raw) : null;
  const now = Math.floor(Date.now() / 1000);
  const limit = Number(env.RATE_LIMIT_PER_HOUR);

  const decision = decideRateLimit(existing, now, limit, RATE_LIMIT_WINDOW_SECONDS);
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(decision.record), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return decision.allowed;
}

function buildSystemPrompt(moduleSlug: string): string | null {
  const entry = (modulesContext as Record<string, { title: string; content: string }>)[moduleSlug];
  if (!entry) return null;
  return `You are a course assistant embedded in the "${entry.title}" module of an LLM & Transformers course. Answer the learner's question using the module content below as primary context, but you may also draw on your general knowledge to explain related concepts. Keep answers focused and concise.\n\n---\n${entry.content}\n---`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
    }

    const systemPrompt = buildSystemPrompt(body.module);
    if (!systemPrompt) {
      return jsonResponse({ error: `Unknown module: ${body.module}` }, 400, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const allowed = await checkRateLimit(env, ip);
    if (!allowed) {
      return jsonResponse({ error: "Rate limit exceeded, try again later." }, 429, origin);
    }

    const trimmedHistory = (body.messages ?? []).slice(-MAX_HISTORY_TURNS);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: trimmedHistory,
      }),
    });

    if (!anthropicResponse.ok) {
      return jsonResponse({ error: "Upstream chat request failed." }, 502, origin);
    }

    const data = await anthropicResponse.json();
    const reply = data.content?.[0]?.text ?? "";
    return jsonResponse({ reply }, 200, origin);
  },
};
```

- [ ] **Step 3: Type-check the Worker**

Run: `cd worker && npm install -D @cloudflare/workers-types && npx tsc --noEmit`
Expected: no type errors. (This requires `worker/src/context/modules.json` to exist — run `node ../scripts/build_chat_context.mjs` from the repo root first if it's missing.)

- [ ] **Step 4: Dry-run the deploy build**

Run: `npx wrangler deploy --dry-run --outdir dist` (from `worker/`)
Expected: succeeds and reports a bundle size — this confirms the Worker builds correctly without requiring real Cloudflare/Anthropic credentials. A live end-to-end call requires the user's own Cloudflare account, KV namespace, and `ANTHROPIC_API_KEY` secret (spec §9); that verification happens after this plan, once those are set up.

- [ ] **Step 5: Commit**

```bash
cd "/home/steve/Agent Lab/llm-transformers-course"
git add worker/wrangler.toml worker/src/index.ts worker/package.json
git commit -m "Add Cloudflare Worker chat proxy handler"
```

---

### Task 12: Chat widget frontend + Module 1 integration

**Files:**
- Create: `assets/js/chat-client.mjs`
- Test: `test/chat-client.test.mjs`
- Create: `_includes/chat-widget.html`
- Create: `assets/js/chat-widget.js`
- Modify: `_config.yml` (add a `chat_worker_url` site variable)

**Interfaces:**
- Produces: `buildChatRequest(moduleSlug, history, newUserText) -> {module, messages}` and `parseChatResponse(json) -> string` (throws if `json.error` is set). Consumed by `assets/js/chat-widget.js`.

- [ ] **Step 1: Write the failing test**

```javascript
// test/chat-client.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChatRequest, parseChatResponse } from "../assets/js/chat-client.mjs";

test("buildChatRequest appends the new user message to history", () => {
  const history = [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }];
  const result = buildChatRequest("01-dnn-refresher", history, "what is dropout?");
  assert.equal(result.module, "01-dnn-refresher");
  assert.equal(result.messages.length, 3);
  assert.deepEqual(result.messages[2], { role: "user", content: "what is dropout?" });
});

test("parseChatResponse returns the reply text on success", () => {
  const text = parseChatResponse({ reply: "Dropout randomly masks units during training." });
  assert.equal(text, "Dropout randomly masks units during training.");
});

test("parseChatResponse throws on an error response", () => {
  assert.throws(() => parseChatResponse({ error: "Rate limit exceeded" }), /Rate limit exceeded/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/chat-client.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```javascript
// assets/js/chat-client.mjs
export function buildChatRequest(moduleSlug, history, newUserText) {
  return {
    module: moduleSlug,
    messages: [...history, { role: "user", content: newUserText }],
  };
}

export function parseChatResponse(json) {
  if (json.error) {
    throw new Error(json.error);
  }
  return json.reply;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/chat-client.test.mjs`
Expected: all 3 tests pass.

- [ ] **Step 5: Add the chat worker URL to `_config.yml`**

Add this line under the existing `_config.yml` content (from Task 1):

```yaml
chat_worker_url: "https://llm-course-chat.YOUR-SUBDOMAIN.workers.dev"
```

Note: `YOUR-SUBDOMAIN` must be replaced with the real Worker URL after the user completes the Cloudflare setup in spec §9 and runs a real `wrangler deploy`.

- [ ] **Step 6: Write `_includes/chat-widget.html`**

```html
<!-- _includes/chat-widget.html -->
<section id="chat-widget-root" data-module="{{ include.slug }}" data-title="{{ include.title }}" data-worker-url="{{ site.chat_worker_url }}">
  <h2>Ask a question about this module</h2>
  <div id="chat-log"></div>
  <input type="text" id="chat-input" placeholder="Ask Claude about this module...">
  <button id="chat-send">Send</button>
  <p id="chat-status"></p>
</section>
<script type="module" src="{{ '/assets/js/chat-widget.js' | relative_url }}"></script>
```

- [ ] **Step 7: Write `assets/js/chat-widget.js`**

```javascript
// assets/js/chat-widget.js
import { buildChatRequest, parseChatResponse } from "./chat-client.mjs";

function appendMessage(log, role, text) {
  const p = document.createElement("p");
  p.className = `chat-message chat-message-${role}`;
  p.textContent = `${role === "user" ? "You" : "Claude"}: ${text}`;
  log.appendChild(p);
}

function init() {
  const root = document.getElementById("chat-widget-root");
  if (!root) return;

  const moduleSlug = root.dataset.module;
  const workerUrl = root.dataset.workerUrl;
  const log = document.getElementById("chat-log");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const status = document.getElementById("chat-status");

  if (!workerUrl || workerUrl.includes("YOUR-SUBDOMAIN")) {
    status.textContent =
      "Chat isn't configured yet — set chat_worker_url in _config.yml once the Cloudflare Worker is deployed (see README setup steps).";
    input.disabled = true;
    sendBtn.disabled = true;
    return;
  }

  let history = [];

  sendBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;
    appendMessage(log, "user", text);
    input.value = "";
    status.textContent = "Thinking...";

    try {
      const body = buildChatRequest(moduleSlug, history, text);
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const reply = parseChatResponse(json);
      appendMessage(log, "assistant", reply);
      history = [...body.messages, { role: "assistant", content: reply }];
      status.textContent = "";
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  });
}

init();
```

- [ ] **Step 8: Wire the include into Module 1's page**

This was already added as a placeholder line in Task 6 Step 1 (`{% include chat-widget.html slug=page.slug title=page.title %}`) — no further edit needed there. Verify it renders:

Run: `bundle exec jekyll build`
Expected: no errors; `_site/modules/01-dnn-refresher/index.html` contains `id="chat-widget-root"`.

- [ ] **Step 9: Commit**

```bash
git add assets/js/chat-client.mjs test/chat-client.test.mjs _includes/chat-widget.html assets/js/chat-widget.js _config.yml
git commit -m "Add chat widget frontend and wire it into Module 1"
```

---

### Task 13: Worker deploy workflow

**Files:**
- Create: `.github/workflows/worker-deploy.yml`

**Interfaces:**
- Consumes: `scripts/build_chat_context.mjs` (Task 10), `worker/` (Tasks 9, 11).

- [ ] **Step 1: Write the workflow (manual trigger only, until the user adds Cloudflare secrets)**

```yaml
name: Deploy chat Worker

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: worker
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Generate chat context
        run: node ../scripts/build_chat_context.mjs
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: worker
```

Note: this is `workflow_dispatch`-only (manual) rather than triggered on every push to `worker/**`, because it will fail until the user adds the `CLOUDFLARE_API_TOKEN` repo secret (spec §9). Once that secret exists, a `push` trigger with `paths: ["worker/**"]` can be added.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/worker-deploy.yml
git commit -m "Add manual Worker deploy workflow"
```

---

### Task 14: README with full setup instructions

**Files:**
- Modify: `README.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Write `README.md`**

```markdown
# LLM & Transformers Course

A comprehensive, self-paced course covering DNN/CNN/RNN foundations through
modern text and vision Transformers — published as a GitHub Pages site at
<https://nsteve2407.github.io/llm-transformers-course/>.

## Repo layout

- `modules/<slug>/` — per-module content, reading list, quiz data
- `notebooks/<slug>/` — paired starter/solution PyTorch notebooks, Colab-runnable
- `worker/` — Cloudflare Worker that proxies the in-page "ask a question" chat widget to the Anthropic API
- `_includes/`, `assets/js/` — Jekyll includes and the quiz/chat client-side JS

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000/llm-transformers-course/>.

Run JS unit tests: `node --test test/*.test.mjs`
Run Worker unit tests: `cd worker && npm install && npm test`

## One-time setup for the chat widget

The chat widget needs a Cloudflare Worker (holding your Anthropic API key
as a secret) deployed once:

1. Create a free Cloudflare account at <https://dash.cloudflare.com> if you don't have one.
2. `npm install -g wrangler` then `wrangler login`.
3. Create a KV namespace for rate limiting: `cd worker && wrangler kv namespace create RATE_LIMIT_KV`, then paste the returned `id` into `worker/wrangler.toml`.
4. Generate an API key at <https://console.anthropic.com>, then from `worker/`: `wrangler secret put ANTHROPIC_API_KEY` and paste it in when prompted.
5. Regenerate context and deploy: `node ../scripts/build_chat_context.mjs && npx wrangler deploy` (run from `worker/`). Note the `*.workers.dev` URL it prints.
6. Set that URL as `chat_worker_url` in `_config.yml`, commit, and push.
7. For automatic redeploys on `worker/` changes: create a scoped Cloudflare API token with Workers deploy permission, add it as the GitHub Actions repo secret `CLOUDFLARE_API_TOKEN`, then trigger `.github/workflows/worker-deploy.yml` manually (`gh workflow run worker-deploy.yml`) or add a `push` trigger for `worker/**`.

## Course content status

Module 1 (DNN Refresher) is fully built out as the reference implementation.
Modules 2–13 follow the same structure (content + reading.md + quiz.yml +
notebook pair) and are tracked in follow-up implementation plans under
`docs/superpowers/plans/`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add README with setup instructions"
```

---

### Task 15: Final integration verification and deploy

**Files:** none — verification only.

- [ ] **Step 1: Full local build**

Run: `bundle exec jekyll build`
Expected: no errors.

- [ ] **Step 2: Run the full JS and Worker test suites**

Run: `node --test test/*.test.mjs`
Expected: all pass (7 tests total across quiz-logic and chat-client).

Run: `cd worker && npm test`
Expected: all pass (4 tests).

- [ ] **Step 3: Push and confirm the Pages deploy picks up all changes**

```bash
cd "/home/steve/Agent Lab/llm-transformers-course"
git push origin master
gh run watch --exit-status
```
Expected: the `pages.yml` workflow succeeds.

- [ ] **Step 4: Verify the live page**

Run: `curl -s https://nsteve2407.github.io/llm-transformers-course/modules/01-dnn-refresher/ | grep -c "DNN Refresher"`
Expected: at least `1`.

Manually open the live URL in a browser and confirm: the module content and reading list render, the quiz renders 10 questions and grades at least one right/one wrong answer correctly (per spec §10), and the chat widget section renders (it will show the "not configured yet" message until the user completes Task 14's Cloudflare setup — that's expected at this stage).
