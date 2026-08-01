---
title: "6. Scaling & Modern LLMs"
parent: Modules
nav_order: 6
slug: 06-scaling-modern-llms
has_children: true
---

# Module 6: Scaling & Modern LLMs

Scaling laws, RoPE, RMSNorm, SwiGLU, GQA, BPE tokenization, nanoGPT build.

## Subtopics

- Kaplan et al. power-law scaling of loss with N/D/C; sample efficiency of larger models
- Chinchilla's compute-optimal N/D reallocation and why GPT-3-era models were undertrained
- LLaMA's deliberate "overtraining" beyond compute-optimal N for inference efficiency
- RoPE: rotating query/key vector pairs to encode relative position via rotation matrices
- RMSNorm: dropping LayerNorm's re-centering term, normalizing only by RMS statistic
- Pre-norm vs. post-norm placement of RMSNorm
- SwiGLU feed-forward blocks and the ~8/3·d_model hidden-dim rescaling LLaMA uses to match param count
- MHA → MQA → GQA: shared KV heads across query-head groups, KV-cache/throughput tradeoff
- BPE tokenization: iterative merging of most-frequent adjacent symbol pairs; byte-level variants
- Putting it together: LLaMA = decoder-only Transformer + RoPE + RMSNorm (pre-norm) + SwiGLU + (larger variants) GQA
- Practical consequences for training stability, KV-cache size, and inference cost

## Reading list

See [Module 6 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"nanoGPT-style model on tiny Shakespeare"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/06-scaling-modern-llms/exercise_starter.ipynb){:target="_blank"}.

Build a character-level tokenizer and a ~1-10M param decoder-only Transformer (4-6 blocks, causal multi-head self-attention + MLP, pre-norm), a training loop with AdamW + periodic eval, and autoregressive sampling with temperature/top-k. Extension: swap learned positional embeddings for RoPE, LayerNorm for RMSNorm, or the MLP for SwiGLU at matched parameter count, and compare against the baseline.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.06_scaling_modern_llms %}

{% include chat-widget.html slug=page.slug title=page.title %}
