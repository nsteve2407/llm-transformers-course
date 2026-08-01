---
title: "7. RL for LLMs"
parent: Modules
nav_order: 7
slug: 07-rl-for-llms
has_children: true
---

# Module 7: RL for LLMs

RLHF (reward model + PPO), DPO, GRPO, RLVR/reasoning-model training.

## Subtopics

- The three-stage RLHF pipeline (SFT → reward model → RL fine-tuning) and why it's staged rather than end-to-end
- Bradley-Terry preference model and the reward model's pairwise logistic loss
- PPO's clipped surrogate objective as a trust-region approximation without second-order optimization
- The KL penalty against a frozen reference policy (reward = RM score − β·KL) and why unconstrained RL against a learned RM degenerates
- Value/critic network and GAE in PPO; the need for a token-level value head for LLM PPO
- InstructGPT's concrete pipeline (demonstration data → comparison data → PPO) at production scale
- DPO's reparameterization: closed-form optimal policy collapses RLHF into a single classification-style loss, no explicit RM or rollouts
- DPO (offline, static preference data) vs. PPO-RLHF (online, on-policy sampling) tradeoffs
- GRPO: removing the critic by sampling a group of completions per prompt and using group-relative advantages
- RLVR: rule-based/verifiable rewards (math correctness, unit tests, format checks) replacing a learned RM, sidestepping reward hacking
- DeepSeek-R1 recipe: R1-Zero (pure RL, no SFT) vs. R1 (cold-start SFT → large-scale RL → rejection sampling → final RL), emergent long CoT
- Reward hacking / over-optimization as a general failure mode, and how KL penalties / RM ensembling / verifiable rewards each mitigate it

## Reading list

See [Module 7 Reading List](reading.html) for required and optional papers, plus lecture references.

## Coding exercise

**"DPO from scratch on a toy verifiable-reward task"** — [Open the starter notebook in Colab](https://colab.research.google.com/github/nsteve2407/llm-transformers-course/blob/master/notebooks/07-rl-for-llms/exercise_starter.ipynb){:target="_blank"}.

A from-scratch tiny character-level transformer over a digit vocabulary, with a rule-based verifiable reward (count of adjacent ascending digits). Generate synthetic preference pairs ranked by the reward; pretrain and freeze a reference policy; run a minimal PPO loop (clipped surrogate + KL penalty vs. reference); separately implement the DPO loss directly on (prompt, chosen, rejected) triplets; evaluate and compare, then ablate DPO's β and PPO's KL coefficient toward 0 to observe reward hacking/mode collapse.

{% include quiz.html slug=page.slug quiz=site.data.quizzes.07_rl_for_llms %}

{% include chat-widget.html slug=page.slug title=page.title %}
