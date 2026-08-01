---
title: "12. CLIP (Contrastive Vision-Language Pretraining)"
parent: Modules
nav_order: 12
slug: 12-clip
has_children: true
---

# Module 12: CLIP — Contrastive Vision-Language Pretraining

Joint image-text embeddings, symmetric contrastive loss, and zero-shot classification via prompts.

## Subtopics

- Joint image-text embedding space via projection into a shared multimodal vector space
- Dual-encoder architecture: independent image encoder (ResNet/ViT) + text encoder (Transformer over BPE), each with a linear projection into the shared dim
- Symmetric contrastive (InfoNCE-style) loss over an N×N batch similarity matrix, averaged image→text and text→image
- Cosine similarity between L2-normalized embeddings; the learned temperature/logit-scale parameter
- Large-scale, noisy, web-collected image-text pairs (~400M) substituting for costly curated labels
- Zero-shot classification via prompt engineering ("a photo of a {class}") and scoring against candidate class text embeddings
- Prompt ensembling (averaging ~80 templates) for robustness
- Open-vocabulary recognition with zero task-specific fine-tuning
- Zero-shot vs. linear-probe evaluation on frozen CLIP features
- Downstream uses: DALL-E 2/Stable Diffusion conditioning, retrieval, general-purpose visual features
- Known limitations: typographic attacks, inherited web-data bias, weak fine-grained/counting/spatial reasoning
- Why large batch sizes matter for contrastive pretraining (in-batch negatives)

## Reading list

See [Module 12 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Zero-shot classification and retrieval with pretrained CLIP"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/12-clip/exercise_starter.ipynb){:target="_blank"}.

Part A: load `openai/clip-vit-base-patch32`, build several prompt templates per class over a small labeled set (5-6 CIFAR-10 classes), classify via cosine similarity, implement and compare naive vs. engineered vs. ensembled prompt accuracy. Part B: assemble a small unlabeled image corpus, precompute CLIP image embeddings, implement text-to-image and image-to-image retrieval, and try free-text queries outside the original label set to show open-vocabulary retrieval.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.12_clip %}

{% include chat-widget.html slug=page.slug title=page.title %}
