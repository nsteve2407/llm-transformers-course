---
title: "3. RNNs + LSTMs"
parent: Modules
nav_order: 3
slug: 03-rnn-lstm
has_children: true
---

# Module 3: RNNs + LSTMs

Vanilla RNN, BPTT, vanishing/exploding gradients, LSTM, GRU, seq2seq, Bahdanau/Luong attention.

## Subtopics

- Vanilla RNN recurrence, unrolling, parameter sharing across time
- Backpropagation through time: gradient as a sum over time steps involving repeated Jacobian products
- Truncated BPTT and its bias/tractability tradeoff
- Vanishing/exploding gradients tied to the recurrent weight matrix's spectral norm
- Gradient clipping fixes exploding but not vanishing gradients
- LSTM cell: forget/input/output gates, candidate cell state, additive update as "constant error carousel"
- Why the additive update gives gradient ≈ forget-gate value instead of repeated matrix multiplication
- GRU as a simplified alternative: reset/update gates, merged states
- Bidirectional RNNs and why they can't be used for autoregressive decoding
- Seq2seq: fixed-length context vector, autoregressive decoding, the information-bottleneck problem
- Bahdanau (additive) attention: alignment scores, softmax-weighted context vector
- Luong (multiplicative/dot-product) attention and global vs. local variants
- How RNN-based attention motivates Transformer self-attention (query/key/value framing)

## Reading list

See [Module 3 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Copy/repeat-delay task: vanilla RNN vs. LSTM, with gradient-flow diagnostics"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/03-rnn-lstm/exercise_starter.ipynb){:target="_blank"}.

Implement a vanilla RNN cell and LSTM cell manually (raw tensor ops, no `nn.RNN`/`nn.LSTM`). Train both on a synthetic copy task across delay lengths; plot accuracy vs. delay (vanilla RNN should collapse past a critical delay; LSTM stays stable) and gradient norm vs. time step at a fixed long delay (exponential decay for vanilla RNN, much flatter for LSTM).

{% include quiz.html slug=page.slug quiz=site.data.quizzes.03_rnn_lstm %}

{% include chat-widget.html slug=page.slug title=page.title %}
