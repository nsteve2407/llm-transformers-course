---
title: "Project Brief"
parent: "13. Capstone"
nav_order: 2
---

# Module 13 Project Brief

Pick one of the three options below, or propose a comparable alternative. Each is scoped for
roughly **1-2 weeks of part-time work on a free or Colab-Pro GPU**. None of these require novel
research — the goal is to build something real end-to-end, evaluate it honestly, and understand
why it behaves the way it does.

---

## Option A — Train a small GPT on tiny Shakespeare, study how it samples

Build and train a 2-6 layer decoder-only Transformer from scratch on tiny Shakespeare; implement
greedy, temperature, top-k, and top-p sampling from scratch; evaluate the result quantitatively
(held-out perplexity, self-BLEU/distinct-n) and qualitatively.

### Core deliverables

- [ ] A decoder-only Transformer (2-6 layers) implemented and trained from scratch on tiny
      Shakespeare — no pretrained checkpoints.
- [ ] Greedy, temperature, top-k, and top-p (nucleus) sampling implemented from scratch (no library
      sampling calls — you write the selection logic yourself).
- [ ] Held-out perplexity reported on a proper train/val split.
- [ ] Self-BLEU and distinct-n reported for each sampling strategy, with a brief interpretation of
      what the numbers mean for that strategy.
- [ ] A short written qualitative comparison of sample outputs across sampling strategies (e.g. how
      does top-p at different p values compare to greedy in terms of repetition and coherence?).

### Evaluation / how you know it worked

- **Held-out perplexity**: how well the model predicts held-out text it wasn't trained on, on
  average — lower is better. It's a standard language-modeling metric; you've computed a version of
  this already in earlier modules.
- **Self-BLEU**: generate a batch of samples from the model, then score each sample against the
  *other* generated samples (not against ground truth) using BLEU. High self-BLEU means the model's
  outputs are similar to each other (low diversity); low self-BLEU means more varied generations.
- **Distinct-n**: the fraction of unique n-grams (e.g. unique bigrams or trigrams) among all
  n-grams generated, across a batch of samples. Higher distinct-n means less repetition within and
  across generations.
- Report these side-by-side across sampling strategies (e.g. greedy vs. top-k=40 vs. top-p=0.9) so
  the tradeoff between coherence and diversity is visible in the numbers, not just anecdotally.

### Stretch goals

- Swap learned/absolute positional embeddings for RoPE and compare.
- Train a small family of model sizes and plot a mini scaling-law curve (loss vs. parameter count
  or compute).
- Benchmark inference speed and memory with and without a KV cache.
- Fine-tune the trained model on a second, different corpus and compare adaptation behavior.

### Suggested scope

~1-2 weeks part-time; a free Colab GPU or Colab Pro is sufficient — tiny Shakespeare and a
2-6 layer model train quickly even on modest hardware.

---

## Option B — Fine-tune ViT/Swin on a custom small image dataset, with real error analysis

Assemble a custom dataset of roughly 1k-20k images with proper train/val/test splits; compare full
fine-tuning vs. linear-probe vs. partial unfreezing of a pretrained ViT or Swin; go beyond
top-line accuracy into a real error analysis — confusion matrix, highest-confidence wrong
predictions, and attention-rollout/Grad-CAM on correct vs. incorrect examples.

### Core deliverables

- [ ] A custom image dataset (~1k-20k images) with a proper train/val/test split (not just a random
      shuffle — think about how classes and any near-duplicates are distributed across splits).
- [ ] A pretrained ViT or Swin backbone fine-tuned three ways: full fine-tuning, linear-probe
      (frozen backbone, train only the head), and partial unfreezing (e.g. last few blocks).
- [ ] Accuracy (and any other relevant top-line metric) reported for all three fine-tuning
      strategies, compared side-by-side.
- [ ] A confusion matrix over the test set, with a short written discussion of which classes are
      confused and any plausible reasons why.
- [ ] The model's highest-confidence *wrong* predictions pulled out and inspected individually —
      what's actually going on in those images?
- [ ] Attention-rollout or Grad-CAM visualizations comparing what the model attends to on correctly
      vs. incorrectly classified examples.

### Evaluation / how you know it worked

- **Confusion matrix**: a table showing, for each true class, how the model's predictions were
  distributed across all classes. The diagonal is correct predictions; everything off-diagonal is a
  specific kind of mistake — it tells you *which* classes get confused with which, not just an
  overall error rate.
- **Highest-confidence wrong predictions**: among the test examples the model got wrong, the ones
  where it was most confident (highest predicted probability) in the wrong answer. These are often
  the most informative errors to look at — either genuinely ambiguous/mislabeled examples, or a
  real blind spot in what the model learned.
- **Attention-rollout / Grad-CAM**: both are ways of visualizing *where in the image* a model's
  prediction is coming from. Attention-rollout traces attention weights back through a ViT's layers
  to produce a rough map of which image regions influenced the output; Grad-CAM uses gradients
  flowing back into a convolutional (or convolutional-like) layer to do the same. Comparing these
  maps on correct vs. incorrect examples is a way to see whether errors come from the model looking
  at the wrong part of the image, not just from noisy scores.
- The point of this option is that "accuracy went up" isn't the finish line — the error analysis
  and the discussion of *why* the model gets things wrong is the actual deliverable.

### Stretch goals

- A head-to-head comparison of ViT vs. Swin on the same dataset and splits.
- A simple active-learning loop (train, find the most uncertain unlabeled examples, label them,
  retrain).
- A small Gradio demo for interactive inference.
- Distillation from the fine-tuned model into a smaller one, with an accuracy/size tradeoff report.

### Suggested scope

~1-2 weeks part-time; a free Colab GPU or Colab Pro is sufficient for datasets in this size range
with a pretrained backbone.

---

## Option C — CLIP-based image search / retrieval mini-app

Curate a local image library, embed it with CLIP, and index it by cosine similarity (or FAISS);
build a small Gradio or Streamlit UI where a free-text query returns the top-k matching images;
build a hand-labeled query-to-relevant-image evaluation set and report retrieval metrics
(recall@k, MRR) rather than relying on eyeballing results.

### Core deliverables

- [ ] A curated local image library (your choice of domain/size — big enough to make retrieval
      meaningful, small enough to embed and index quickly).
- [ ] All images embedded with a pretrained CLIP model, indexed by cosine similarity (a simple
      brute-force search is fine; FAISS is optional here and a stretch below for scale).
- [ ] A working Gradio or Streamlit UI: a free-text query box that returns the top-k most similar
      images.
- [ ] A hand-labeled evaluation set of queries with their known-relevant images (you write the
      queries and mark which images in your library should match each one).
- [ ] Recall@k and MRR reported on that evaluation set, with a brief interpretation of the numbers.

### Evaluation / how you know it worked

- **Recall@k**: for each query, whether at least one relevant image appears in the top-k retrieved
  results, averaged across all queries. It answers "how often does the system surface a relevant
  result if I only look at the top k?"
- **MRR (Mean Reciprocal Rank)**: for each query, take 1 divided by the rank position of the first
  relevant result (e.g. if the first relevant image is ranked 3rd, that query scores 1/3), then
  average across all queries. It rewards relevant results appearing *earlier*, not just appearing
  somewhere in the top-k.
- Report both metrics rather than just demoing a few queries that happen to work well — the
  hand-labeled eval set is what turns "the demo looks cool" into an actual measurement of retrieval
  quality.

### Stretch goals

- A zero-shot auto-tagging hybrid search that combines text-query similarity with automatically
  generated tags.
- Image-to-image search (query by example image, not just text).
- Swap in a larger or fine-tuned OpenCLIP checkpoint and compare retrieval quality.
- Benchmark FAISS approximate-nearest-neighbor search latency against brute-force cosine similarity
  as the library size grows.

### Suggested scope

~1-2 weeks part-time; a free Colab GPU or Colab Pro is sufficient — CLIP embedding of a modest
local image library is fast, and the UI/eval work is largely CPU-bound.

---

## Alternatives

If none of A/B/C fit what you want to build, propose a comparable alternative. The spec calls out
two examples explicitly; either is a reasonable target, treated more briefly here than A/B/C since
the shape of the work is similar to Option B or C, just applied to a different task.

**A DETR-style detector fine-tuned for a downstream task.** Take a DETR-style (or similar
transformer-based) object detector, fine-tune it on a downstream detection task, and report
detection metrics (e.g. mAP) with some qualitative inspection of failure cases — analogous in
spirit to the error-analysis expectations in Option B.

**An image-captioning project pairing a ViT/CLIP encoder with the Module 6 GPT decoder.** Pair a
ViT or CLIP image encoder with the decoder-only GPT architecture from Module 6, train on a small
paired image-caption dataset (e.g. a Flickr8k subset), and evaluate generated captions both
quantitatively (e.g. a captioning metric like BLEU against reference captions) and qualitatively
(a written review of caption quality on a sample of images, including failure cases).

Whichever alternative you pick, aim for the same shape as A/B/C: a concrete built artifact, a
quantitative evaluation with metrics you understand and can explain, and a qualitative look at
where it fails.

---

## General expectations for any option

*Optional, but good practice for any self-directed project:* consider writing a short report or
README (a page or so) summarizing what you built, your evaluation results, and what you'd do
differently with more time or a bigger GPU budget. This isn't a formal requirement — this module is
intentionally open-ended, and a working project with clear evaluation is the real deliverable — but
having a short writeup you can point to later (in a portfolio, in an interview, or just for your
own notes) tends to be worth the extra half hour it takes.
