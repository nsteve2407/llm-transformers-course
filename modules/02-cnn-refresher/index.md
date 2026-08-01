---
title: "2. CNN Refresher"
parent: Modules
nav_order: 2
slug: 02-cnn-refresher
has_children: true
---

# Module 2: CNN Refresher

Convolutions, pooling, classic architectures, receptive fields, batchnorm in CNNs.

## Subtopics

- Output-dimension arithmetic from kernel/stride/padding/dilation; same vs. valid padding; depthwise/grouped convs
- Parameter sharing → translation equivariance vs. invariance
- 1x1 convolutions as per-pixel channel projections; bottleneck blocks, Inception modules
- Max vs. average pooling; strided convs as a pooling replacement
- Receptive field growth across stacked layers; why two 3x3 convs beat one 5x5
- LeNet-5: alternating conv/subsampling, tanh/sigmoid activations
- AlexNet: ReLU, dropout, local response norm, two-GPU split
- VGG: stacked 3x3 convs, uniform depth scaling
- The empirical "degradation problem" in deep plain CNNs (distinct from vanishing gradients)
- ResNet: identity skip connections F(x)+x, basic vs. bottleneck blocks
- BatchNorm in CNNs: per-channel stats across (N,H,W), conv→BN→ReLU convention
- Forward pointer to multi-scale/attention-based vision models

## Reading list

See [Module 2 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Depth, gradients, and residuals on a CIFAR-10 subset"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/02-cnn-refresher/exercise_starter.ipynb){:target="_blank"}.

Implement `Conv2dManual` and validate against `F.conv2d`. Build "PlainNet" (no skips) and "ResNet" counterparts at 3 depths (8/20/44 layers), train on a CIFAR-10 subset. Plot training loss and first-layer gradient norms across all six — should reproduce the degradation effect in plain nets and healthy gradients in ResNets.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.02_cnn_refresher %}

{% include chat-widget.html slug=page.slug title=page.title %}
