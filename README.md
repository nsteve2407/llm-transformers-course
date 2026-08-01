# LLM & Transformers Course

A comprehensive, self-paced course covering DNN/CNN/RNN foundations through
modern text and vision Transformers — published as a GitHub Pages site at
<https://nsteve2407.github.io/llm-transformers-course/>.

## Repo layout

- `modules/<slug>/` — per-module content and reading list
- `_data/quizzes/<slug_with_underscores>.yml` — per-module quiz data
- `notebooks/<slug>/` — paired starter/solution PyTorch notebooks, Colab-runnable
- `worker/` — Cloudflare Worker that proxies the in-page "ask a question" chat widget to the Anthropic API
- `_includes/`, `assets/js/` — Jekyll includes and the quiz/chat client-side JS

## Quiz data convention

Quiz data files use an **underscored** slug (e.g. `01_dnn_refresher.yml`),
not the **hyphenated** module directory name (`modules/01-dnn-refresher/`).
This is required because Jekyll data files are exposed to Liquid as
`site.data.quizzes.<key>`, and hyphens aren't valid in Liquid's dot-notation
property lookup. When adding a new module, make sure the quiz file under
`_data/quizzes/` uses underscores even though the module directory under
`modules/` uses hyphens.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000/llm-transformers-course/>.

Run JS unit tests: `node --test test/*.test.mjs`
Run Worker unit tests: `cd worker && npm install && npm test`

## Notebook dependencies

Colab preinstalls a recent `transformers`, but not every package a notebook might need (e.g. `timm`
for later vision modules). The convention for notebooks that need a package beyond what Colab
preinstalls by default:

- Add a guarded install cell as the notebook's first code cell (right after the header/badge markdown
  cell):

  ```python
  try:
      import <package>
  except ImportError:
      %pip install -q <package>
  ```

  This no-ops on Colab (and any environment that already has the package), documents the dependency
  explicitly, and self-heals on an environment where it's missing.

Current notebooks needing a package beyond Colab's defaults:

- `notebooks/05-llm-lineage/`, `notebooks/08-efficient-transformers/`, `notebooks/09-vit/`, and
  `notebooks/10-swin/` need `transformers`. This repo's own environment tests against
  `transformers==4.18.0`; Colab's preinstalled version works too, but that pin is what's verified here.

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

Every module currently listed under `modules/` (see the sidebar, or `ls modules/`) is fully built
out: content page, reading list, quiz data, and a starter/solution notebook pair. Additional modules
are added incrementally, each following that same structure, via follow-up implementation plans
tracked under `docs/superpowers/plans/`.
