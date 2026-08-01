---
title: "4. Attention Is All You Need"
parent: Modules
nav_order: 4
slug: 04-attention
has_children: true
---

# Module 4: Attention Is All You Need

Self/multi-head attention, positional encoding, full architecture, build from scratch.

## Subtopics

- Scaled dot-product attention and why the 1/√d_k scaling factor is needed
- Multi-head attention: per-head projections, concatenation, output projection; why 8 smaller heads beat 1 large head
- Self-attention vs. cross-attention (encoder self-attn, decoder masked self-attn, encoder-decoder cross-attn)
- Sinusoidal positional encoding formula and its relative-position property
- Learned vs. fixed positional embeddings; sequence-length extrapolation
- Encoder-decoder stack: 6 layers each, sublayer composition
- Position-wise FFN: two affine transforms with ReLU, d_model↔d_ff
- Post-LN vs. Pre-LN placement and training stability/warmup implications
- Padding masks vs. causal/look-ahead masks
- Training regime: label smoothing, Noam LR schedule, embedding weight tying
- Computational complexity: self-attention O(n²·d) vs. RNN O(n·d²) vs. conv layers; max path length
- Attention as a differentiable soft dictionary lookup, connecting back to Bahdanau attention

## Reading list

See [Module 4 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Build multi-head self-attention and a full encoder block from scratch"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/04-attention/exercise_starter.ipynb){:target="_blank"}.

`nn.MultiheadAttention`/`nn.TransformerEncoderLayer` are forbidden for the implementation itself (usable only afterward as a correctness oracle). Implement Q/K/V projections, scaled-dot-product attention with reshaping into (batch, heads, seq, d_k), additive masking (padding + causal), head concat + output projection, both sinusoidal and learned positional encodings, and a full encoder block in both Post-LN and Pre-LN forms. Validate by copying weights into `nn.MultiheadAttention`/`nn.TransformerEncoderLayer` and checking numerical agreement.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.04_attention %}

{% include chat-widget.html slug=page.slug title=page.title %}
