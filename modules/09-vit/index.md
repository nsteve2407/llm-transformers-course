---
title: "9. Vision Transformer (ViT)"
parent: Modules
nav_order: 9
slug: 09-vit
has_children: true
---

# Module 9: Vision Transformer (ViT)

Patch embeddings, [CLS] token, DeiT distillation.

## Subtopics

- Image-to-patch tokenization: splitting H×W×C into N=HW/P² patches, flattening
- Linear projection of patches into embedding dim (equivalent to Conv2d(kernel=stride=P))
- Learnable [CLS] token (borrowed from BERT) as pooled classification representation
- 1D learnable position embeddings vs. 2D/sinusoidal alternatives — ablations found little benefit from 2D-aware schemes
- Standard pre-norm transformer encoder block reused unchanged from NLP transformers
- Inductive-bias comparison with CNNs: loss of locality/translation-equivariance, substituted by large-scale pretraining
- Data-efficiency gap: ViT underperforms CNNs from scratch on small/mid datasets
- Attention map visualization and attention rollout
- Hybrid ViT: CNN (ResNet) stem producing feature-map "patches" instead of raw pixels
- Fine-tuning at higher resolution + 2D interpolation of position embeddings
- DeiT's distillation token: second learnable token trained via a teacher's hard-label predictions
- DeiT's data-efficiency recipe: RandAugment, Mixup, CutMix, stochastic depth

## Reading list

See [Module 9 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"ViT from scratch vs. CNN baseline vs. fine-tuned pretrained ViT, on CIFAR-10"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/09-vit/exercise_starter.ipynb){:target="_blank"}.

Build patch embedding, [CLS] token + learned position embeddings, and pre-norm encoder blocks for a small "ViT-Tiny". Train from scratch on CIFAR-10 (no pretraining), compare against a similarly-sized CNN baseline and a fine-tuned pretrained ViT — illustrating ViT's data hunger and how pretraining buys back the missing inductive bias.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.09_vit %}

{% include chat-widget.html slug=page.slug title=page.title %}
