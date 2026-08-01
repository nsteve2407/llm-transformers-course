---
title: "10. Hierarchical ViTs (Swin Transformer)"
parent: Modules
nav_order: 10
slug: 10-swin
has_children: true
---

# Module 10: Hierarchical ViTs (Swin Transformer)

## Subtopics

- Why global MSA is O((HW)²) in patch count and prohibitive for dense high-res tasks
- Windowed MSA (W-MSA): non-overlapping M×M windows, within-window attention only
- Complexity: O((HW)²) global vs. O(HW·M²) linear windowed — deriving the FLOPs
- Shifted-window MSA (SW-MSA): alternating regular/displaced window layouts for cross-window connections at linear cost
- The cyclic-shift trick (`torch.roll`) for efficient batched SW-MSA vs. padding
- Masking to prevent attention leakage between non-adjacent regions cyclically shifted into the same window
- Relative position bias vs. absolute embeddings; Swin V2's continuous position bias
- Patch merging: 2×2 neighbor concat + linear projection, halving resolution/doubling channels per stage
- 4-stage hierarchical architecture mirroring CNN feature pyramids
- Swin block structure: LN→W-MSA/SW-MSA→residual→LN→MLP→residual, always in W/SW pairs
- Swin as a drop-in backbone for dense prediction (Mask R-CNN, UperNet)
- Empirical comparison vs. plain ViT/DeiT and ResNets on ImageNet-1K/COCO/ADE20K

## Reading list

See [Module 10 Reading List](reading.html) for required and optional papers. No lecture reference specifically dedicated to Swin was found during course design — see the reading list for details.

## Coding exercise

**"Implement shifted-window attention from scratch + fine-tune Swin vs. ViT"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/10-swin/exercise_starter.ipynb){:target="_blank"}.

Implement `window_partition`/`window_reverse`, windowed attention with a relative position bias table, and shifted-window attention (roll + region-id mask + reverse roll), unit-tested against a naive brute-force reference. Then fine-tune pretrained Swin-Tiny and a comparably-sized ViT on a CIFAR-10 subset and compare accuracy, params, memory, and throughput — including at higher resolution, to expose Swin's linear vs. ViT's quadratic scaling.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.10_swin %}

{% include chat-widget.html slug=page.slug title=page.title %}
