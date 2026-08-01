---
title: "5. The LLM Lineage"
parent: Modules
nav_order: 5
slug: 05-llm-lineage
has_children: true
---

# Module 5: The LLM Lineage

BERT, GPT-1/2/3, T5, pretraining objectives.

## Subtopics

- BERT's MLM objective: 15% masking, 80/10/10 rule, why bidirectional context needs this indirect objective
- NSP as an auxiliary objective and its later critique/removal
- BERT input representation: WordPiece, [CLS]/[SEP], segment embeddings
- BERT's fine-tuning paradigm: task-specific heads on a shared pretrained encoder
- GPT-1: unsupervised causal-LM pretraining + supervised fine-tuning with task-specific input transformation
- GPT-2: scale to 1.5B params + WebText, zero-shot task transfer via pure LM framing
- GPT-3: scale to 175B params, in-context learning (zero/one/few-shot) with no gradient updates
- T5's text-to-text framework unifying tasks via task prefixes
- T5's span-corruption objective vs. BERT's token-level masking
- Architectural taxonomy: encoder-only vs. decoder-only vs. encoder-decoder, and which tasks each suits
- Scaling trajectory GPT-1→2→3 and the emergence of in-context learning
- Fine-tuning vs. gradient-free in-context learning as adaptation paradigms

## Reading list

See [Module 5 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"Pretraining objectives side-by-side with `bert-base-uncased`, `gpt2`, `t5-small`"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/05-llm-lineage/exercise_starter.ipynb){:target="_blank"}.

Implement, from scratch (not library collators): an MLM collator implementing the 80/10/10 rule; a causal-LM setup demonstrating in-context learning by hand-writing 0/1/5-shot prompts for a toy classification task; a span-corruption collator with T5 sentinel tokens. Finally, plot BERT's bidirectional vs. GPT-2's causal attention patterns side-by-side for the same sentence.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.05_llm_lineage %}

{% include chat-widget.html slug=page.slug title=page.title %}
