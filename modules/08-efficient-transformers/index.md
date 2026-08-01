---
title: "8. Efficient Transformers"
parent: Modules
nav_order: 8
slug: 08-efficient-transformers
has_children: true
---

# Module 8: Efficient Transformers

FlashAttention, KV caching, quantization, RoPE-extension for long context.

## Subtopics

- FlashAttention's tiling: splitting Q/K/V into SRAM-sized blocks to avoid materializing the full N×N attention matrix in HBM
- IO-awareness: attention is memory-bandwidth-bound, not FLOP-bound, on GPUs
- Online softmax: numerically stable incremental softmax via running max/sum rescaling
- Recomputation-based backward pass instead of storing the O(N²) matrix
- FlashAttention-2's refinements: reduced non-matmul FLOPs, better GPU work partitioning
- KV caching: turning each decode step from O(seq²) into O(seq) incremental work; prefill vs. decode asymmetry
- KV cache memory formula: 2 × batch × seq_len × layers × heads × head_dim × bytes
- MQA and GQA as KV-cache-size reduction techniques
- GPTQ's layer-wise post-training quantization minimizing per-layer reconstruction error via approximate Hessian info
- bitsandbytes' LLM.int8(): outlier-feature-aware mixed int8/fp16 matmul
- 4-bit NF4 quantization (QLoRA): quantile-based dtype optimal for normally-distributed weights, double quantization
- RoPE's poor extrapolation beyond trained context length, and YaRN's NTK-aware interpolation fix

## Reading list

See [Module 8 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"KV-cache benchmark for autoregressive generation"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/08-efficient-transformers/exercise_starter.ipynb){:target="_blank"}.

Load a small causal LM (GPT-2 small). Implement generation without KV caching (full forward pass every step) and with KV caching (incremental). Benchmark both across generation lengths, plot time and peak memory vs. sequence length, and verify the KV-cache memory formula against measured numbers.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.08_efficient_transformers %}

{% include chat-widget.html slug=page.slug title=page.title %}
