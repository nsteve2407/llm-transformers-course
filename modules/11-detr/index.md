---
title: "11. DETR (Object Detection with Transformers)"
parent: Modules
nav_order: 11
slug: 11-detr
has_children: true
---

# Module 11: DETR — Object Detection with Transformers

Set prediction, object queries, bipartite matching, and the end of NMS.

## Subtopics

- Object detection reframed as direct set prediction, vs. anchor-based (Faster R-CNN) and NMS-dependent (YOLO) pipelines
- What anchors/NMS/proposals solve in classical detectors
- DETR architecture: CNN backbone → flattened feature map → transformer encoder → transformer decoder → parallel FFN heads
- Spatial positional encodings for 2D CNN feature maps
- Object queries: fixed learned decoder-input slots, each specializing via cross-attention
- Decoder self-attention among queries enabling implicit de-duplication (replacing NMS)
- Bipartite matching via the Hungarian algorithm between predictions and padded ground truth
- Matching cost: classification cost + box L1 + generalized IoU (GIoU); why plain IoU is insufficient (zero gradient when non-overlapping)
- Hungarian/set-prediction loss: matched-pair classification NLL + box L1/GIoU, summed over the optimal assignment
- No-object (∅) class and down-weighting its loss for class imbalance
- NMS/anchor elimination as a consequence of one-to-one matching (permutation invariance)
- Known limitations (slow convergence, weak small-object detection, quadratic attention over large feature maps) → Deformable DETR

## Reading list

See [Module 11 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Hungarian matching from scratch + applied pretrained DETR"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/11-detr/exercise_starter.ipynb){:target="_blank"}.

Part A: build a synthetic toy scene (3 ground-truth objects, 5 predicted queries), implement GIoU from scratch and unit-test it, build the matching cost matrix, solve with `scipy.optimize.linear_sum_assignment`, compute the full Hungarian/set-prediction loss, and verify permutation invariance under GT reordering. Part B: load `facebook/detr-resnet-50`, run inference, visualize predicted boxes and object-query cross-attention maps, and fine-tune on a small detection subset.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.11_detr %}

{% include chat-widget.html slug=page.slug title=page.title %}
