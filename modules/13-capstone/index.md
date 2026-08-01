---
title: "13. Capstone"
parent: Modules
nav_order: 13
slug: 13-capstone
has_children: true
---

# Module 13: Capstone

Apply what you've built across the course to one open-ended, self-directed project.

## Overview

This module is different from Modules 1-12: there's no fixed reading list of papers to master or a
single correct notebook to fill in. Instead, you pick one project (or propose a comparable
alternative) and work through it end-to-end — scoping, building, and evaluating it yourself, the
way you would outside a course. Each option below is scoped for roughly 1-2 weeks of part-time work
on a free or Colab-Pro GPU.

See the [Project Brief](project-brief.html) for the three options, their concrete deliverables, and
what "done" looks like for each — and the [Where to Go Next](reading.html) page for pointers past
this course's scope (diffusion models, vision-language instruction tuning, LLM agents) if you want
to keep going afterward.

## Options at a glance

- **Option A — Train a small GPT on tiny Shakespeare, study how it samples.** Build and train a
  small decoder-only Transformer from scratch, implement sampling strategies from scratch, and
  evaluate quantitatively and qualitatively.
- **Option B — Fine-tune ViT/Swin on a custom small image dataset, with real error analysis.**
  Compare fine-tuning strategies and dig into *why* the model gets things wrong, not just how often.
- **Option C — CLIP-based image search / retrieval mini-app.** Build a working text-to-image search
  tool over a curated image library, with a real evaluation set and retrieval metrics.
- **Alternatives**: a DETR-style detector fine-tuned for a downstream task, or an image-captioning
  project pairing a ViT/CLIP encoder with the Module 6 GPT decoder.

Full details, deliverables, and stretch goals for each are in the [Project Brief](project-brief.html).

{% include quiz.html slug=page.slug quiz=site.data.quizzes.13_capstone %}

{% include chat-widget.html slug=page.slug title=page.title %}
