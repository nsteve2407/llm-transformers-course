---
title: "1. DNN Refresher"
parent: Modules
nav_order: 1
slug: 01-dnn-refresher
has_children: true
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

{% include quiz.html slug=page.slug quiz=site.data.quizzes.01_dnn_refresher %}

{% include chat-widget.html slug=page.slug title=page.title %}
