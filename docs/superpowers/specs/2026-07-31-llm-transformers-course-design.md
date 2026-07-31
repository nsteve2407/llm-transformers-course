# LLM & Transformers Course — Design Spec

Date: 2026-07-31
Status: Draft, pending user review

## 1. Goals & scope

A comprehensive, self-paced learning course covering (in order):

1. A refresher on DNNs and CNNs (learner already knows these — refresher depth, not from-zero)
2. RNNs and LSTMs (bridge into attention)
3. Transformers for text — architecture, the BERT/GPT/T5 lineage, scaling and modern LLM architecture tricks, RL-based post-training (RLHF/DPO/GRPO/RLVR), and efficient-transformer engineering
4. Transformers for vision — ViT, Swin, DETR, CLIP
5. A capstone project

Delivered as a public GitHub Pages site with, per module: written content, a verified reading list, a PyTorch coding exercise (Colab-runnable notebook), an interactive quiz, and an embedded chat widget grounded in that module's content for asking Claude questions in place.

## 2. Architecture

- **Site**: Jekyll + [Just the Docs](https://just-the-docs.com/) theme. Built via GitHub Actions (`actions/jekyll-build-pages` + `actions/deploy-pages`), not the legacy GitHub-managed Jekyll build — this is required anyway to allow the theme/plugins/custom JS we need, and deploys from a **public** repo (required for GitHub Pages on a free plan).
- **Repo**: `llm-transformers-course`, public, created via `gh repo create`, local working copy at `/home/steve/Agent Lab/llm-transformers-course`.
- **Coding exercises**: PyTorch, as paired Jupyter notebooks (`exercise_starter.ipynb` / `exercise_solution.ipynb`) per module, each with an "Open in Colab" badge.
- **Reading lists**: real, individually verified papers/posts/lectures per module (see §4) — every URL below was fetched and confirmed to resolve and match its claimed title/author during design research; none were guessed.
- **Quizzes**: client-side JS component, no backend, instant feedback.
- **Chat widget**: a Cloudflare Worker (free tier) proxies requests to the Anthropic API using a server-side secret; the page embeds a small chat box per module that calls the Worker. The Worker grounds each conversation with that module's own content as system-prompt context. See §7 for full design.

## 3. Repo structure

```
llm-transformers-course/
  _config.yml, Gemfile, Gemfile.lock        # Jekyll + Just the Docs config
  index.md                                  # course home / how to use this course
  modules/
    01-dnn-refresher/
      index.md                              # content page (front matter: nav order, parent, etc.)
      reading.md                            # required + optional reading, embedded as a Just the Docs child page
      quiz.yml                              # quiz questions/answers (data file, not rendered directly)
    02-cnn-refresher/
    03-rnn-lstm/
    04-attention/
    05-llm-lineage/
    06-scaling-modern-llms/
    07-rl-for-llms/
    08-efficient-transformers/
    09-vit/
    10-swin/
    11-detr/
    12-clip/
    13-capstone/
  notebooks/
    01-dnn-refresher/{exercise_starter.ipynb, exercise_solution.ipynb}
    ... (one pair per module, 1-12; module 13 has project briefs instead, see §4.13)
  assets/
    js/quiz.js
    js/chat-widget.js
    css/custom.scss                         # Just the Docs style overrides if needed
  scripts/
    build_chat_context.mjs                  # generates worker/src/context/*.json from modules/*/index.md
  worker/                                   # Cloudflare Worker proxy — separate deployable
    src/index.ts
    src/context/                            # generated, gitignored except a .gitkeep
    wrangler.toml
    package.json
  .github/workflows/
    pages.yml                               # build & deploy the Jekyll site
    worker-deploy.yml                       # deploy the Cloudflare Worker on worker/** changes
  README.md
  .gitignore
```

## 4. Curriculum

Each module page includes: subtopics, required reading, optional/further reading, lecture references (where a genuinely relevant one exists — flagged as absent rather than guessed in a couple of vision-module cases), a coding exercise, and quiz question topics (expanded into full question+answer+explanation triples when `quiz.yml` is authored during implementation).

---

### Part 1 — Foundations Refresher

#### Module 1: DNN Refresher
*MLPs, backpropagation, optimization (SGD/Adam), regularization, initialization*

**Subtopics**
- MLP forward pass mechanics: affine transforms, activations, how depth/width shape representable functions
- Computational graphs and reverse-mode autodiff; why reverse mode suits scalar-loss/many-parameter functions
- Full backprop derivation for an MLP: local gradients, the delta/error-signal recursion, batched matrix form
- Vanishing/exploding gradients in deep nets from repeated Jacobian multiplication
- Xavier/Glorot vs. He initialization — deriving the variance-scaling constants
- SGD variants: momentum, Nesterov's look-ahead gradient
- Adam/RMSprop internals: moment estimates, bias correction, and why it matters early in training
- Why L2 regularization and true weight decay diverge under Adam (the AdamW motivation)
- LR schedules: step decay, cosine annealing, warmup (especially for adaptive optimizers)
- Dropout: train-time random masking, inverted dropout scaling
- BatchNorm: train-time batch stats vs. inference-time running stats, learnable γ/β
- Cross-entropy + softmax numerical stability (log-sum-exp trick)

**Required reading**
- Kingma & Ba (2014). *Adam: A Method for Stochastic Optimization.* https://arxiv.org/abs/1412.6980
- Ioffe & Szegedy (2015). *Batch Normalization.* https://arxiv.org/abs/1502.03167
- Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov (2014). *Dropout.* https://jmlr.org/papers/v15/srivastava14a.html
- He, Zhang, Ren, Sun (2015). *Delving Deep into Rectifiers.* https://arxiv.org/abs/1502.01852
- Glorot & Bengio (2010). *Understanding the difficulty of training deep feedforward neural networks.* https://proceedings.mlr.press/v9/glorot10a.html
- Loshchilov & Hutter (2017/2019). *Decoupled Weight Decay Regularization (AdamW).* https://arxiv.org/abs/1711.05101

**Optional/further reading**
- Goh (2017). *Why Momentum Really Works.* Distill. https://distill.pub/2017/momentum/
- Ruder (2016). *An overview of gradient descent optimization algorithms.* https://www.ruder.io/optimizing-gradient-descent/
- Santurkar, Tsipras, Ilyas, Madry (2018). *How Does Batch Normalization Help Optimization?* https://arxiv.org/abs/1805.11604
- Stanford CS231n, *Backpropagation, Intuitions.* https://cs231n.github.io/optimization-2/

**Lecture references**
- Stanford CS231n, *Neural Networks Part 2* (init/batchnorm/dropout). https://cs231n.github.io/neural-networks-2/
- Stanford CS231n, *Neural Networks Part 3* (optimizers, LR schedules). https://cs231n.github.io/neural-networks-3/

**Coding exercise — "MLP from scratch, then scale up"** (PyTorch, Colab, ~1.5-2h)
Part A: implement a 2-layer MLP (784→128→10) for MNIST using raw tensor ops only — manual forward + backward pass (no `.backward()`), verified against autograd (max abs diff < 1e-5) and finite-difference checks. Part B: reimplement with `nn.Module`/autograd, train with SGD / SGD+momentum / Adam / AdamW vs. Adam+L2 at matched decay, plot loss curves showing the AdamW/Adam+L2 divergence empirically. Part C: add Dropout + BatchNorm1d, demonstrate train vs. eval-mode behavior.

**Quiz topics**: softmax+cross-entropy gradient derivation · reverse- vs forward-mode autodiff · Adam bias-correction effect early in training · AdamW vs Adam+L2 · Nesterov vs classical momentum · Xavier vs He init derivation · diagnosing vanishing/exploding gradients from init/activation/depth · inverted dropout scaling · BatchNorm train/eval statistics and small-batch effects · log-sum-exp trick

---

#### Module 2: CNN Refresher
*Convolutions, pooling, classic architectures, receptive fields, batchnorm in CNNs*

**Subtopics**
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

**Required reading**
- LeCun, Bottou, Bengio, Haffner (1998). *Gradient-Based Learning Applied to Document Recognition.* https://cs.nyu.edu/~yann/2010f-G22-2565-001/diglib/lecun-98.pdf
- Krizhevsky, Sutskever, Hinton (2012). *ImageNet Classification with Deep CNNs (AlexNet).* https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks
- Simonyan & Zisserman (2014). *Very Deep Convolutional Networks (VGG).* https://arxiv.org/abs/1409.1556
- He, Zhang, Ren, Sun (2015). *Deep Residual Learning (ResNet).* https://arxiv.org/abs/1512.03385
- Ioffe & Szegedy (2015). *Batch Normalization.* https://arxiv.org/abs/1502.03167

**Optional/further reading**
- Dumoulin & Visin (2016). *A Guide to Convolution Arithmetic.* https://arxiv.org/abs/1603.07285
- Araujo, Norris, Sim (2019). *Computing Receptive Fields of CNNs.* Distill. https://distill.pub/2019/computing-receptive-fields/
- Olah, Mordvintsev, Schubert (2017). *Feature Visualization.* Distill. https://distill.pub/2017/feature-visualization/
- Stanford CS231n, *Convolutional Neural Networks.* https://cs231n.github.io/convolutional-networks/

**Lecture references**: Stanford CS231n course hub — https://cs231n.github.io/

**Coding exercise — "Depth, gradients, and residuals on a CIFAR-10 subset"** (PyTorch, Colab, ~1.5-2h)
Implement `Conv2dManual` and validate against `F.conv2d`. Build "PlainNet" (no skips) and "ResNet" counterparts at 3 depths (8/20/44 layers), train on a 10k-image CIFAR-10 subset. Plot training loss and first-layer gradient norms across all six — should reproduce the degradation effect in plain nets and healthy gradients in ResNets. Stretch: remove BatchNorm from PlainNet to isolate BN's contribution from the skip connection's.

**Quiz topics**: output-shape arithmetic from kernel/stride/padding/dilation · translation equivariance vs invariance · 1x1 convs as projections · receptive field after N stacked k×k layers · why two 3x3 beats one 5x5 · pooling tradeoffs · AlexNet's specific innovations · degradation problem vs vanishing gradients · why F(x)+x eases gradient flow · BatchNorm axes and train/inference stats

---

#### Module 3: RNNs + LSTMs
*Vanilla RNN, BPTT, vanishing/exploding gradients, LSTM, GRU, seq2seq, Bahdanau/Luong attention*

**Subtopics**
- Vanilla RNN recurrence, unrolling, parameter sharing across time
- Backpropagation through time: gradient as a sum over time steps involving repeated Jacobian products
- Truncated BPTT and its bias/tractability tradeoff
- Vanishing/exploding gradients tied to the recurrent weight matrix's spectral norm
- Gradient clipping fixes exploding but not vanishing gradients
- LSTM cell: forget/input/output gates, candidate cell state, additive update as "constant error carousel"
- Why the additive update gives gradient ≈ forget-gate value instead of repeated matrix multiplication
- GRU as a simplified alternative: reset/update gates, merged states
- Bidirectional RNNs and why they can't be used for autoregressive decoding
- Seq2seq: fixed-length context vector, autoregressive decoding, the information-bottleneck problem
- Bahdanau (additive) attention: alignment scores, softmax-weighted context vector
- Luong (multiplicative/dot-product) attention and global vs. local variants
- How RNN-based attention motivates Transformer self-attention (query/key/value framing)

**Required reading**
- Hochreiter & Schmidhuber (1997). *Long Short-Term Memory.* Neural Computation 9(8). https://doi.org/10.1162/neco.1997.9.8.1735
- Cho et al. (2014). *Learning Phrase Representations using RNN Encoder–Decoder (introduces GRU).* https://arxiv.org/abs/1406.1078
- Sutskever, Vinyals, Le (2014). *Sequence to Sequence Learning with Neural Networks.* https://arxiv.org/abs/1409.3215
- Bahdanau, Cho, Bengio (2014/2015). *Neural Machine Translation by Jointly Learning to Align and Translate.* https://arxiv.org/abs/1409.0473
- Luong, Pham, Manning (2015). *Effective Approaches to Attention-based NMT.* https://arxiv.org/abs/1508.04025

**Optional/further reading**
- Olah (2015). *Understanding LSTM Networks.* https://colah.github.io/posts/2015-08-Understanding-LSTMs/
- Alammar (2018). *Visualizing A Neural Machine Translation Model.* https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/
- Karpathy (2015). *The Unreasonable Effectiveness of Recurrent Neural Networks.* http://karpathy.github.io/2015/05/21/rnn-effectiveness/
- Olah & Carter (2016). *Attention and Augmented Recurrent Neural Networks.* Distill. https://distill.pub/2016/augmented-rnns/

**Lecture references**
- Stanford CS224n Notes Part V — *Language Models, RNN, GRU and LSTM.* https://web.stanford.edu/class/cs224n/readings/cs224n-2019-notes05-LM_RNN.pdf
- Stanford CS224n Notes Part VI — *NMT, Seq2seq and Attention.* https://web.stanford.edu/class/cs224n/readings/cs224n-2019-notes06-NMT_seq2seq_attention.pdf

**Coding exercise — "Copy/repeat-delay task: vanilla RNN vs. LSTM, with gradient-flow diagnostics"** (PyTorch, Colab CPU, ~1-2h)
Implement a vanilla RNN cell and LSTM cell manually (raw tensor ops, no `nn.RNN`/`nn.LSTM`). Train both on a synthetic copy task across delay lengths T ∈ {5,20,50,100}; plot accuracy vs. T (vanilla RNN should collapse past a critical T; LSTM stays stable) and ∂L/∂h_t norm vs. t at a fixed long T (exponential decay for vanilla RNN, much flatter for LSTM). Optional: repeat with/without gradient clipping to show it addresses explosion but not the vanishing trend.

**Quiz topics**: identifying the repeated-Jacobian term causing vanishing/exploding gradients · why clipping only fixes exploding gradients · LSTM gate roles · why LSTM's additive update preserves gradient magnitude · GRU vs LSTM tradeoffs · why bidirectional RNNs can't be causal · fixed-length context bottleneck · Bahdanau vs Luong attention scoring · computing attention weights from toy vectors · line from RNN attention to Transformer self-attention

---

### Part 2 — Transformers: Text

#### Module 4: Attention Is All You Need
*Self/multi-head attention, positional encoding, full architecture, build from scratch*

**Subtopics**
- Scaled dot-product attention and why the 1/√d_k scaling factor is needed
- Multi-head attention: per-head projections, concatenation, output projection; why 8 smaller heads beat 1 large head
- Self-attention vs. cross-attention (encoder self-attn, decoder masked self-attn, encoder-decoder cross-attn)
- Sinusoidal positional encoding formula and its relative-position property
- Learned vs. fixed positional embeddings; sequence-length extrapolation
- Encoder-decoder stack: 6 layers each, sublayer composition
- Position-wise FFN: two affine transforms with ReLU, d_model↔d_ff
- Post-LN vs. Pre-LN placement and training stability/warmup implications
- Padding masks vs. causal/look-ahead masks
- Training regime: label smoothing, Noam LR schedule, embedding weight tying
- Computational complexity: self-attention O(n²·d) vs. RNN O(n·d²) vs. conv layers; max path length
- Attention as a differentiable soft dictionary lookup, connecting back to Bahdanau attention

**Required reading**
- Vaswani et al. (2017). *Attention Is All You Need.* https://arxiv.org/abs/1706.03762
- Bahdanau, Cho, Bengio (2014/2015). https://arxiv.org/abs/1409.0473
- Ba, Kiros, Hinton (2016). *Layer Normalization.* https://arxiv.org/abs/1607.06450
- Xiong et al. (2020). *On Layer Normalization in the Transformer Architecture.* https://arxiv.org/abs/2002.04745
- Shaw, Uszkoreit, Vaswani (2018). *Self-Attention with Relative Position Representations.* https://arxiv.org/abs/1803.02155

**Optional/further reading**
- Alammar (2018). *The Illustrated Transformer.* https://jalammar.github.io/illustrated-transformer/
- Harvard NLP. *The Annotated Transformer.* https://nlp.seas.harvard.edu/annotated-transformer/
- Weng (2018). *Attention? Attention!* https://lilianweng.github.io/posts/2018-06-24-attention/
- Weng (2023). *The Transformer Family Version 2.0.* https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/

**Lecture references**
- Stanford CS224N — https://web.stanford.edu/class/cs224n/
- Stanford CS25: Transformers United — https://web.stanford.edu/class/cs25/
- Karpathy, *Let's build GPT.* https://www.youtube.com/watch?v=kCc8FmEb1nY

**Coding exercise — build multi-head self-attention and a full encoder block from scratch**
`nn.MultiheadAttention`/`nn.TransformerEncoderLayer` forbidden for the implementation itself (usable only afterward as a correctness oracle). Implement Q/K/V projections, scaled-dot-product attention with reshaping into (batch, heads, seq, d_k), additive masking (padding + causal), head concat + output projection, both sinusoidal and learned positional encodings, and a full encoder block in both Post-LN and Pre-LN forms. Validate by copying weights into `nn.MultiheadAttention`/`nn.TransformerEncoderLayer` and checking `torch.allclose`; visualize attention heatmaps; empirically verify the causal mask blocks future-token leakage.

**Quiz topics**: purpose of 1/√d_k scaling · why multiple smaller heads vs one large head · self- vs cross- vs masked self-attention · sinusoidal PE formula and relative-position property · learned vs fixed PE and extrapolation · Post-LN vs Pre-LN and warmup · causal vs padding masks · attention vs RNN vs CNN complexity · position-wise FFN purpose/dims · embedding weight tying

---

#### Module 5: The LLM Lineage
*BERT, GPT-1/2/3, T5, pretraining objectives*

**Subtopics**
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

**Required reading**
- Devlin, Chang, Lee, Toutanova (2018/2019). *BERT.* https://arxiv.org/abs/1810.04805
- Radford, Narasimhan, Salimans, Sutskever (2018). *Improving Language Understanding by Generative Pre-Training (GPT-1).* https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
- Radford, Wu, Child, Luan, Amodei, Sutskever (2019). *Language Models are Unsupervised Multitask Learners (GPT-2).* https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- Brown et al. (2020). *Language Models are Few-Shot Learners (GPT-3).* https://arxiv.org/abs/2005.14165
- Raffel et al. (2019/2020). *Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5).* https://arxiv.org/abs/1910.10683

**Optional/further reading**
- Alammar (2018). *The Illustrated BERT, ELMo, and co.* https://jalammar.github.io/illustrated-bert/
- Alammar (2019). *The Illustrated GPT-2.* https://jalammar.github.io/illustrated-gpt2/
- Raschka. *Ch.17: Encoder- and Decoder-Style Transformers.* https://sebastianraschka.com/books/ml-q-and-ai-chapters/ch17/
- Weng (2019). *Generalized Language Models.* https://lilianweng.github.io/posts/2019-01-31-lm/

**Lecture references**: Stanford CS224N — https://web.stanford.edu/class/cs224n/ · Stanford CS25 — https://web.stanford.edu/class/cs25/

**Coding exercise — pretraining objectives side-by-side with `bert-base-uncased`, `gpt2`, `t5-small`**
From scratch (not library collators): (1) an MLM collator implementing the 80/10/10 rule, `-100`-masked labels, measure masked-token top-1 accuracy; (2) a causal-LM setup with shifted labels + causal mask, generate via greedy/top-k, and demonstrate in-context learning by hand-writing 0/1/5-shot prompts for a toy classification task, plotting accuracy vs. shots; (3) a span-corruption collator with T5 sentinel tokens, inspect predicted fills. Finally plot BERT's bidirectional vs. GPT-2's causal attention patterns side-by-side for the same sentence.

**Quiz topics**: BERT's 80/10/10 masking rule · NSP's purpose and critique · fine-tuning vs in-context learning · what changed GPT-1→2→3 · zero/one/few-shot definitions · T5 span-corruption vs BERT token masking · T5's text-to-text prefixes · encoder-only vs decoder-only vs encoder-decoder attention patterns and task fit · [CLS]/[SEP]/segment embeddings · scaling trend and emergent in-context learning

---

#### Module 6: Scaling & Modern LLMs
*Scaling laws, RoPE, RMSNorm, SwiGLU, GQA, BPE tokenization, nanoGPT build*

**Subtopics**
- Kaplan et al. power-law scaling of loss with N/D/C; sample efficiency of larger models
- Chinchilla's compute-optimal N/D reallocation and why GPT-3-era models were undertrained
- LLaMA's deliberate "overtraining" beyond compute-optimal N for inference efficiency
- RoPE: rotating query/key vector pairs to encode relative position via rotation matrices
- RMSNorm: dropping LayerNorm's re-centering term, normalizing only by RMS statistic
- Pre-norm vs. post-norm placement of RMSNorm
- SwiGLU feed-forward blocks and the ~8/3·d_model hidden-dim rescaling LLaMA uses to match param count
- MHA → MQA → GQA: shared KV heads across query-head groups, KV-cache/throughput tradeoff
- BPE tokenization: iterative merging of most-frequent adjacent symbol pairs; byte-level variants
- Putting it together: LLaMA = decoder-only Transformer + RoPE + RMSNorm (pre-norm) + SwiGLU + (larger variants) GQA
- Practical consequences for training stability, KV-cache size, and inference cost

**Required reading**
- Kaplan et al. (2020). *Scaling Laws for Neural Language Models.* https://arxiv.org/abs/2001.08361
- Hoffmann et al. (2022). *Training Compute-Optimal Large Language Models (Chinchilla).* https://arxiv.org/abs/2203.15556
- Su, Lu, Pan, Murtadha, Wen, Liu (2021). *RoFormer (RoPE).* https://arxiv.org/abs/2104.09864
- Touvron et al. (2023). *LLaMA: Open and Efficient Foundation Language Models.* https://arxiv.org/abs/2302.13971
- Ainslie et al. (2023). *GQA.* https://arxiv.org/abs/2305.13245
- Sennrich, Haddow, Birch (2015/2016). *Neural Machine Translation of Rare Words with Subword Units (BPE).* https://arxiv.org/abs/1508.07909

**Optional/further reading**
- Zhang & Sennrich (2019). *Root Mean Square Layer Normalization.* https://arxiv.org/abs/1910.07467
- Shazeer (2020). *GLU Variants Improve Transformer (SwiGLU).* https://arxiv.org/abs/2002.05202
- Raschka. *LLM Architecture Gallery.* https://sebastianraschka.com/llm-architecture-gallery/
- Weng (2023). *The Transformer Family Version 2.0.* https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/
- karpathy/nanoGPT — https://github.com/karpathy/nanoGPT and karpathy/build-nanogpt — https://github.com/karpathy/build-nanogpt

**Lecture references**
- Karpathy, *Let's build GPT.* https://www.youtube.com/watch?v=kCc8FmEb1nY
- Stanford CS25 V2, *Emergent Abilities and Scaling in LLMs* (Jason Wei). https://www.youtube.com/watch?v=tVtOevLrt5U

**Coding exercise — nanoGPT-style model on tiny Shakespeare**
Character-level tokenizer, ~1-10M param decoder-only Transformer (4-6 blocks, causal MHSA + MLP, pre-norm), training loop with AdamW + periodic eval, autoregressive sampling with temperature/top-k. Extension (pick one+): swap learned PE→RoPE, LayerNorm→RMSNorm, or MLP→SwiGLU at matched param count and compare loss curves/samples against baseline, discussing whether the modern component measurably helps at this tiny scale vs. its motivation at LLaMA scale.

**Quiz topics**: interpreting Kaplan power-law curves · Chinchilla's N/D relationship and why it revised Kaplan · why GPT-3-scale was undertrained vs LLaMA's token counts · RoPE mechanics and relative-position property · RMSNorm vs LayerNorm compute savings · SwiGLU structure and hidden-dim rescaling · MHA vs MQA vs GQA KV-cache savings · BPE merge algorithm · matching each modern component to the problem it solves vs vanilla GPT-2 · architectural changes across LLaMA versions

---

#### Module 7: RL for LLMs
*RLHF (reward model + PPO), DPO, GRPO, RLVR/reasoning-model training*

**Subtopics**
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

**Required reading**
- Ouyang et al. (2022). *Training language models to follow instructions with human feedback (InstructGPT).* https://arxiv.org/abs/2203.02155
- Schulman, Wolski, Dhariwal, Radford, Klimov (2017). *Proximal Policy Optimization Algorithms.* https://arxiv.org/abs/1707.06347
- Rafailov, Sharma, Mitchell, Ermon, Manning, Finn (2023). *Direct Preference Optimization.* https://arxiv.org/abs/2305.18290
- Shao et al. (2024). *DeepSeekMath (introduces GRPO).* https://arxiv.org/abs/2402.03300
- DeepSeek-AI (2025). *DeepSeek-R1.* https://arxiv.org/abs/2501.12948

**Optional/further reading**
- Weng. *Policy Gradient Algorithms.* https://lilianweng.github.io/posts/2018-04-08-policy-gradient/
- Hugging Face. *Illustrating RLHF.* https://huggingface.co/blog/rlhf
- Bai et al. (2022, Anthropic). *Training a Helpful and Harmless Assistant with RLHF.* https://arxiv.org/abs/2204.05862
- Hugging Face TRL docs, *GRPO Trainer.* https://huggingface.co/docs/trl/grpo_trainer
- Lambert (Interconnects). *DeepSeek R1's recipe to replicate o1.* https://www.interconnects.ai/p/deepseek-r1-recipe-for-o1

**Lecture references**: Stanford CS224N Sp2024 Lecture 10, "Post-training (RLHF, SFT, DPO)" — syllabus at https://web.stanford.edu/class/archive/cs/cs224n/cs224n.1246/

**Coding exercise — "DPO from scratch on a toy verifiable-reward task"**
A from-scratch 2-layer, 2-head character-level transformer over a tiny digit vocabulary (trains in minutes on CPU/T4). Reward = a rule-based, verifiable function (count of adjacent ascending digits). Steps: generate synthetic preference pairs ranked by the rule-based reward; pretrain a reference policy (stand-in for SFT) and freeze a copy; (optional) train a Bradley-Terry reward model; run a minimal PPO loop (clipped surrogate + KL penalty vs. reference); separately implement the DPO loss directly on (prompt, chosen, rejected) triplets from the same reference checkpoint; evaluate all three policies and plot reward distributions; ablate DPO's β and PPO's KL coefficient toward 0 to observe reward hacking/mode collapse.

**Quiz topics**: why PPO uses a KL penalty against a reference policy · Bradley-Terry assumptions · DPO's implicit vs explicit reward model · why GRPO drops the critic and how group-relative advantage works · what makes a reward "verifiable" and where RLVR breaks down · how PPO's clipping prevents destructive updates · on-policy (PPO) vs offline (DPO) data · reward hacking against a learned RM · SFT's dual role as init and reference policy · R1-Zero vs R1's multi-stage pipeline

---

#### Module 8: Efficient Transformers
*FlashAttention, KV caching, quantization, RoPE-extension for long context*

**Subtopics**
- FlashAttention's tiling: splitting Q/K/V into SRAM-sized blocks to avoid materializing the full N×N attention matrix in HBM
- IO-awareness: attention is memory-bandwidth-bound, not FLOP-bound, on GPUs
- Online softmax: numerically stable incremental softmax via running max/sum rescaling
- Recomputation-based backward pass instead of storing the O(N²) matrix
- FlashAttention-2's refinements: reduced non-matmul FLOPs, better GPU work partitioning
- KV caching: turning each decode step from O(seq²) into O(seq) incremental work; prefill vs. decode asymmetry
- KV cache memory formula: 2 × batch × seq_len × layers × heads × head_dim × bytes
- MQA and GQA as KV-cache-size reduction techniques
- GPTQ's layer-wise post-training quantization minimizing per-layer reconstruction error via approximate Hessian info
- bitsandbytes' LLM.int8(): outlier-feature-aware mixed int8/fp16 matmul
- 4-bit NF4 quantization (QLoRA): quantile-based dtype optimal for normally-distributed weights, double quantization
- RoPE's poor extrapolation beyond trained context length, and YaRN's NTK-aware interpolation fix

**Required reading**
- Dao, Fu, Ermon, Rudra, Ré (2022). *FlashAttention.* https://arxiv.org/abs/2205.14135
- Ainslie et al. (2023). *GQA.* https://arxiv.org/abs/2305.13245
- Frantar, Ashkboos, Hoefler, Alistarh (2022). *GPTQ.* https://arxiv.org/abs/2210.17323
- Dettmers, Lewis, Belkada, Zettlemoyer (2022). *LLM.int8().* https://arxiv.org/abs/2208.07339
- Su, Lu, Pan, Murtadha, Wen, Liu (2021). *RoFormer.* https://arxiv.org/abs/2104.09864
- Peng, Quesnelle, Fan, Shippole (2023). *YaRN.* https://arxiv.org/abs/2309.00071

**Optional/further reading**
- Shazeer (2019). *Fast Transformer Decoding: One Write-Head is All You Need (MQA).* https://arxiv.org/abs/1911.02150
- Press, Smith, Lewis (2021). *ALiBi.* https://arxiv.org/abs/2108.12409
- Hugging Face blog, *4-bit quantization and QLoRA.* https://huggingface.co/blog/4bit-transformers-bitsandbytes
- PyTorch blog, *Out of the box acceleration... with PyTorch 2.0.* https://pytorch.org/blog/out-of-the-box-acceleration/
- Hugging Face docs, *KV cache strategies.* https://huggingface.co/docs/transformers/en/kv_cache

**Lecture references**: Stanford CS336, *Language Modeling from Scratch* (Inference lecture + FlashAttention2 Triton assignment) — https://cs336.stanford.edu/

**Coding exercise — KV-cache benchmark for autoregressive generation** (primary)
Load a small causal LM (e.g. GPT-2 small, fp16) on a free T4. Implement generation without KV caching (full forward pass every step) and with KV caching (incremental). Benchmark both across generation lengths 32-512 tokens (time + `torch.cuda.max_memory_allocated()`); plot time-vs-tokens (no-cache ~quadratic, cached ~linear) and peak memory vs. seq length; verify the KV-cache memory formula against measured numbers. Extension: recompute cache size under MQA/GQA and connect to the GQA paper's motivation. *Lighter alternative*: naive attention vs. `F.scaled_dot_product_attention` (forced through different backends) memory/latency comparison.

**Quiz topics**: why FlashAttention is IO-aware not FLOP-reducing · tiling + online softmax avoiding full attention-matrix materialization · why the backward pass recomputes rather than stores · KV cache memory scaling formula · how GQA interpolates MHA↔MQA · GPTQ's approximate-Hessian error minimization · why NF4 suits normally-distributed weights · weight-only vs weight+activation quantization and outliers · why RoPE models extrapolate poorly past trained context · how YaRN treats low vs high RoPE frequencies differently

---

### Part 3 — Transformers: Vision

#### Module 9: Vision Transformer (ViT)
*Patch embeddings, [CLS] token, DeiT distillation*

**Subtopics**
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

**Required reading**
- Dosovitskiy et al. (2020/2021). *An Image is Worth 16x16 Words (ViT).* https://arxiv.org/abs/2010.11929
- Touvron, Cord, Douze, Massa, Sablayrolles, Jégou (2020/2021). *DeiT.* https://arxiv.org/abs/2012.12877
- Abnar & Zuidema (2020). *Quantifying Attention Flow in Transformers (attention rollout).* https://arxiv.org/abs/2005.00928
- Steiner, Kolesnikov, Zhai, Wightman, Uszkoreit, Beyer (2021). *How to train your ViT?* https://arxiv.org/abs/2106.10270

**Optional/further reading**
- Google Research Blog. *Transformers for Image Recognition at Scale.* https://research.google/blog/transformers-for-image-recognition-at-scale/
- *Dive into Deep Learning*, §11.8, *Transformers for Vision.* https://d2l.ai/chapter_attention-mechanisms-and-transformers/vision-transformer.html

**Lecture references**
- Stanford CS25 V1, *Transformers in Vision* (Lucas Beyer). https://web.stanford.edu/class/cs25/past/cs25-v1/ · video: https://www.youtube.com/watch?v=BP5CM0YxbP8
- Stanford CS231n Lecture 8, *Self-Attention and Transformers.* https://cs231n.stanford.edu/schedule.html

**Coding exercise — ViT from scratch vs. CNN baseline vs. fine-tuned pretrained ViT, on CIFAR-10**
Build patch embedding (P=4, both `unfold`+Linear and Conv2d forms), [CLS] token + learned position embeddings, pre-norm encoder blocks (4 heads, head dim 48), 6-block "ViT-Tiny" (~2-3M params). Train from scratch on CIFAR-10 (no pretraining). Compare against a similarly-sized CNN baseline and a fine-tuned pretrained ViT (`timm`/HF). Optional: implement attention rollout and visualize [CLS] attention on correct/incorrect predictions. Expected result: from-scratch ViT lags the CNN; fine-tuned pretrained ViT wins clearly — illustrating ViT's data hunger and how pretraining buys back the missing inductive bias.

**Quiz topics**: why ViT needs more data/pretraining than CNNs · [CLS] token role · ViT position-embedding design choices · patch-size tradeoffs · which inductive biases CNNs have that ViT lacks · attention rollout vs. raw single-layer attention maps · DeiT's distillation token vs. logit averaging · position-embedding interpolation at higher fine-tuning resolution · hybrid vs. pure-patch ViT · DeiT's augmentation/regularization recipe

---

#### Module 10: Hierarchical ViTs (Swin Transformer)

**Subtopics**
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

**Required reading**
- Liu et al. (2021, ICCV Best Paper). *Swin Transformer.* https://arxiv.org/abs/2103.14030
- Liu et al. *Swin Transformer V2.* https://arxiv.org/abs/2111.09883
- Hugging Face docs, *Swin Transformer.* https://huggingface.co/docs/transformers/model_doc/swin
- Model card: `microsoft/swin-tiny-patch4-window7-224`. https://huggingface.co/microsoft/swin-tiny-patch4-window7-224

**Optional/further reading**
- Arora. *Swin Transformer Explained.* https://amaarora.github.io/posts/2022-07-04-swintransformerv1.html
- Lightly.ai. *Swin Explained: An Overview.* https://www.lightly.ai/blog/swin-transformer
- Official repo: https://github.com/microsoft/Swin-Transformer

**Lecture references**: none found specifically dedicated to Swin — flagged rather than guessed; rely on the readings above.

**Coding exercise — implement shifted-window attention from scratch + fine-tune Swin vs. ViT**
Part A: implement `window_partition`/`window_reverse`, `WindowAttention` (with relative position bias table), and SW-MSA (roll + region-id mask + reverse roll); unit-test against a naive brute-force Python-loop reference across several (H,W,window_size) combos including non-divisible edge cases. Part B: fine-tune pretrained Swin-Tiny and a comparably-sized ViT (from Module 9) on a CIFAR-10 subset via HF `Trainer`; compare accuracy, params, memory, throughput, and throughput at higher resolution (384×384) to expose Swin's linear vs. ViT's quadratic scaling.

**Quiz topics**: why global MSA scales quadratically and its dense-prediction cost · W-MSA vs SW-MSA and why alternating is needed · purpose of the cyclic shift and the resulting masking need · why relative position bias is used per-window · how patch merging builds the hierarchy · linear vs quadratic complexity derivation · Swin block internal structure · why Swin suits detection/segmentation backbones better · accuracy/compute/inductive-bias tradeoffs vs. ViT and ResNets

---

#### Module 11: DETR — Object Detection with Transformers

**Subtopics**
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

**Required reading**
- Carion, Massa, Synnaeve, Usunier, Kirillov, Zagoruyko (2020). *End-to-End Object Detection with Transformers.* https://arxiv.org/abs/2005.12872
- Zhu, Su, Lu, Li, Wang, Dai (2021, ICLR Oral). *Deformable DETR.* https://arxiv.org/abs/2010.04159
- Meta AI Blog. *End-to-end object detection with Transformers.* https://ai.meta.com/blog/end-to-end-object-detection-with-transformers/
- Model card: `facebook/detr-resnet-50`. https://huggingface.co/facebook/detr-resnet-50

**Optional/further reading**
- DigitalOcean. *Introduction to DETR — Part 2: The Hungarian Algorithm.* https://www.digitalocean.com/community/tutorials/introduction-detr-hungarian-algorithm-2
- HF Paper Page for DETR. https://huggingface.co/papers/2005.12872
- Model card: `facebook/detr-resnet-50-panoptic`. https://huggingface.co/facebook/detr-resnet-50-panoptic

**Lecture references**: Stanford CS231n Lecture 9, *Object Detection, Image Segmentation...* (lists DETR among suggested readings) — https://cs231n.stanford.edu/schedule.html

**Coding exercise — Hungarian matching from scratch + applied pretrained DETR**
Part A: synthetic toy scene (3 GT objects, 5 predicted queries) with a known-correct optimal assignment; implement GIoU from scratch and unit-test it; build the matching cost matrix; solve with `scipy.optimize.linear_sum_assignment`; compute the full Hungarian/set-prediction loss; verify permutation invariance under GT reordering. Part B: load `facebook/detr-resnet-50`, run inference, visualize predicted boxes and a few object queries' decoder cross-attention maps; fine-tune on a small custom/COCO-subset detection set; compare pre-/post-fine-tuning qualitatively and via `torchmetrics` mAP.

**Quiz topics**: why set prediction needs an assignment step · what NMS solves and why DETR doesn't need it · anchor boxes' purpose vs. DETR's lack of them · object-query behavior · why Hungarian (optimal) matching over greedy heuristics · the three matching-cost components and why L1 alone is insufficient · why GIoU over plain IoU · no-object class purpose and down-weighting · spatial positional encodings for CNN feature maps · DETR's known weaknesses and Deformable DETR's fix

---

#### Module 12: CLIP — Contrastive Vision-Language Pretraining

**Subtopics**
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

**Required reading**
- Radford, Kim, Hallacy et al. (2021). *Learning Transferable Visual Models From Natural Language Supervision (CLIP).* https://arxiv.org/abs/2103.00020
- Jia, Yang, Xia et al. (2021). *ALIGN.* https://arxiv.org/abs/2102.05918
- Cherti, Beaumont, Wightman et al. (2022). *Reproducible Scaling Laws for Contrastive Language-Image Learning (OpenCLIP).* https://arxiv.org/abs/2212.07143

**Optional/further reading**
- Ramesh, Dhariwal, Nichol, Chu, Chen (2022). *DALL-E 2 (Hierarchical Text-Conditional Image Generation with CLIP Latents).* https://arxiv.org/abs/2204.06125
- Roboflow. *What is CLIP?* https://blog.roboflow.com/openai-clip/
- Wikipedia. *Contrastive Language-Image Pre-training.* https://en.wikipedia.org/wiki/Contrastive_Language-Image_Pre-training

**Lecture references**: Stanford CS231n — Lecture 12 *Self-Supervised Learning*, Lecture 16 *Vision and Language* — https://cs231n.stanford.edu/schedule.html

**Coding exercise — zero-shot classification and retrieval with pretrained CLIP**
Part A: load `openai/clip-vit-base-patch32`; build several prompt templates per class over a small labeled set (5-6 CIFAR-10 classes); compute cosine similarity (scaled by logit_scale) and classify via argmax; implement prompt ensembling (average + renormalize across templates); compare naive vs. engineered vs. ensembled prompt accuracy. Part B: assemble a small unlabeled image corpus, precompute CLIP image embeddings, implement `retrieve(query_text, k)` and `retrieve_similar_images(query_image, k)`; try free-text queries outside the original label set to show open-vocabulary retrieval.

**Quiz topics**: why CLIP's contrastive loss is symmetric over both batch directions · role of the learned temperature · zero-shot classification via natural-language prompts · why prompt engineering/ensembling changes accuracy with frozen weights · zero-shot vs. linear-probe evaluation · why large batch sizes matter for contrastive pretraining · noisy web-scale vs. curated data tradeoffs · open-vocabulary recognition vs. fixed-head classifiers · downstream uses of CLIP embeddings · known CLIP failure modes

---

### Part 4 — Capstone

#### Module 13: Capstone

Pick one (or propose a comparable alternative), each scoped for ~1-2 weeks part-time on a free/Colab-Pro GPU:

**Option A — Train a small GPT on tiny Shakespeare, study how it samples.** Build/train a 2-6 layer decoder-only Transformer from scratch on tiny Shakespeare; implement greedy/temperature/top-k/top-p sampling from scratch; evaluate quantitatively (held-out perplexity, self-BLEU/distinct-n) and qualitatively. Stretch: RoPE swap, mini scaling-law curve, KV-cache benchmarking, fine-tune on a second corpus.

**Option B — Fine-tune ViT/Swin on a custom small image dataset, with real error analysis.** ~1k-20k images; proper splits; compare full fine-tuning vs. linear-probe vs. partial unfreezing; confusion matrix, highest-confidence wrong predictions, attention-rollout/Grad-CAM on correct vs. incorrect examples. Stretch: ViT vs. Swin head-to-head, active-learning loop, Gradio demo, distillation.

**Option C — CLIP-based image search / retrieval mini-app.** Curate a local image library, embed with CLIP, index by cosine similarity (or FAISS); Gradio/Streamlit UI for free-text query → top-k images; hand-labeled query→relevant-image eval set reporting recall@k/MRR. Stretch: zero-shot auto-tagging hybrid search, image-to-image search, larger/fine-tuned OpenCLIP checkpoint, FAISS ANN latency benchmarking.

**Alternatives**: a DETR-style detector fine-tuned for a downstream task, or an image-captioning project pairing a ViT/CLIP encoder with the Module-6 GPT decoder on a small paired dataset (e.g. Flickr8k subset).

**Where to go next** (pointers beyond this course's scope, not full modules)
- Ho, Jain, Abbeel (2020). *Denoising Diffusion Probabilistic Models.* https://arxiv.org/abs/2006.11239
- Weng (2021). *What are Diffusion Models?* https://lilianweng.github.io/posts/2021-07-11-diffusion-models/
- Liu, Li, Wu, Lee (2023, NeurIPS Oral). *Visual Instruction Tuning (LLaVA).* https://arxiv.org/abs/2304.08485
- Weng (2023). *LLM Powered Autonomous Agents.* https://lilianweng.github.io/posts/2023-06-23-agent/
- Yao, Zhao, Yu et al. (2022/2023, ICLR). *ReAct.* https://arxiv.org/abs/2210.03629

---

## 5. Site build & deploy pipeline

`.github/workflows/pages.yml`:
- Trigger: push to `main` (paths: everything except `worker/**`, `notebooks/**` are fine to include since they don't affect the Jekyll build but changing them shouldn't force a rebuild either — restrict trigger paths to `modules/**`, `_config.yml`, `assets/**`, `index.md`, `Gemfile*`).
- Job `build`: checkout → setup Ruby (`ruby/setup-ruby` with bundler cache) → `bundle exec jekyll build` → upload artifact via `actions/upload-pages-artifact`.
- Job `deploy`: needs `build`, uses `actions/deploy-pages`, environment `github-pages`.
- Repo settings: Pages source = "GitHub Actions" (not the legacy branch-based build).

`.github/workflows/worker-deploy.yml`:
- Trigger: push to `main` touching `worker/**`.
- Runs `scripts/build_chat_context.mjs` (regenerates `worker/src/context/*.json` from the current `modules/*/index.md`), then `cloudflare/wrangler-action` to deploy, using repo secret `CLOUDFLARE_API_TOKEN`.

## 6. Quiz component design

- Each module's quiz lives in `modules/<slug>/quiz.yml`: a list of `{type: mcq|short, question, choices?, answer, explanation}`.
- The module's `index.md` embeds the quiz via a Jekyll include, passing the YAML data through Liquid's `| jsonify` into a `<script type="application/json" id="quiz-data">` block.
- `assets/js/quiz.js`: vanilla JS, no dependencies. Renders each question (radio buttons for MCQ; text input with lenient keyword/substring matching plus a "show model answer" reveal for short-answer, since free-text grading isn't reliable client-side). On submit: highlights correct/incorrect per question, shows the explanation, tallies a running score. Fully client-side, resets on reload — no backend, no persistence, matching the "no backend" simplicity goal.
- Target: 8-10 questions per module (13 modules × ~9 questions ≈ 115 total quiz questions to author during implementation, expanding the quiz-topics lists above into full question/answer/explanation triples).

## 7. Chat widget (Cloudflare Worker) design

**Flow**: page loads → chat box renders (collapsed by default, one per module) → user types a question → `assets/js/chat-widget.js` POSTs `{module: "<slug>", messages: [...]}` to the Worker's public URL → Worker builds a system prompt from that module's pre-generated content context + the conversation history → Worker calls the Anthropic Messages API (model: Claude Sonnet) with its secret API key → Worker returns the assistant's reply as JSON → widget renders it.

**Context grounding**: `scripts/build_chat_context.mjs` runs at Worker-deploy time (see §5), reading each `modules/<slug>/index.md`, stripping Jekyll front matter, and writing `worker/src/context/<slug>.json` (`{title, content}`). The Worker bundles these as static assets (via Wrangler's asset/text-module support) so it never needs a network call to fetch course content — it works even if Pages hasn't finished deploying.

**System prompt template**: "You are a course assistant embedded in the '{module title}' module of an LLM & Transformers course. Answer the learner's question using the module content below as primary context, but you may also draw on your general knowledge to explain related concepts. Keep answers focused and concise; use markdown/LaTeX-style notation where it aids clarity.\n\n---\n{module content}\n---"

**Rate limiting & cost control** (important since this is a public site with a real API key behind it):
- Per-IP rate limit via Cloudflare's Workers KV (e.g., 20 requests/hour/IP) — simple counter with a TTL.
- `Access-Control-Allow-Origin` restricted to the exact Pages domain, so other sites can't call the proxy.
- A hard cap on `max_tokens` per response and on conversation history length sent (e.g., last 6 turns) to bound cost per request.
- v1 ships non-streaming (single JSON response) for simplicity; streaming (SSE) noted as a stretch goal.

**Config**: `worker/wrangler.toml` — `name = "llm-course-chat"`, `main = "src/index.ts"`, `compatibility_date`, KV namespace binding for rate limiting.

**Secrets**: `ANTHROPIC_API_KEY` set via `wrangler secret put ANTHROPIC_API_KEY` (never committed).

## 8. Notebook conventions

- `notebooks/<slug>/exercise_starter.ipynb`: first markdown cell has title, objective, links back to the module page and required papers, and an "Open in Colab" badge linking to `https://colab.research.google.com/github/<owner>/llm-transformers-course/blob/main/notebooks/<slug>/exercise_starter.ipynb`. TODO cells marked clearly with `# TODO: ...` and `raise NotImplementedError` stubs.
- `notebooks/<slug>/exercise_solution.ipynb`: same structure, fully implemented, with expected output/plots so the learner can self-check.
- Module 13 (capstone) gets project-brief markdown instead of starter/solution notebooks, since it's open-ended.

## 9. Setup steps required from the user (documented in README, executed during implementation)

1. **GitHub**: `gh repo create llm-transformers-course --public --source=. --remote=origin` (already logged in as `nsteve2407`); enable Pages with source "GitHub Actions" via `gh api` or the repo settings UI.
2. **Cloudflare**: create a free account at dash.cloudflare.com if not already present; `npm i -g wrangler`; `wrangler login`.
3. **Anthropic API key**: generate one at console.anthropic.com; `wrangler secret put ANTHROPIC_API_KEY` from within `worker/`.
4. **Cloudflare API token** (for the auto-deploy workflow): create a scoped token with Workers deploy permission; add as GitHub Actions repo secret `CLOUDFLARE_API_TOKEN`.
5. First `wrangler deploy` to obtain the Worker's `*.workers.dev` URL; set that URL as a build-time constant consumed by `assets/js/chat-widget.js`.

## 10. Success criteria

- `gh repo create` succeeds; Pages is live at the `github.io` URL and renders all 13 modules with working nav/search (Just the Docs sidebar + search)
- Every reading-list link is a real, previously-verified URL (done — see §4; nothing guessed)
- Every notebook runs top-to-bottom in Colab on a free GPU runtime
- Every quiz gives correct instant feedback for at least one right and one wrong answer per question, across all 13 modules
- Chat widget: given a working Anthropic API key and deployed Worker, asking a question grounded in a module's content returns a relevant, on-topic answer; rate limiting visibly kicks in after the configured threshold
