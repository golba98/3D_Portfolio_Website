import type { LanguageModel } from '../types/content';

/**
 * Codexa v1, migrated from the previous site's Model section. Numbers come from
 * MODEL_CARD.md, configs/1b.yaml and the training logs in LLM-Codexa-v1.
 */
export const codexa: LanguageModel = {
  projectId: 'llm',
  title: 'Codexa v1',
  heading: 'I trained a model',
  lede: "Codexa v1 — 934M parameters, trained from scratch on one 16 GB GPU, so Ubume can run a model of its own rather than routing out to someone else's CLI. Base pretraining and conversational SFT are both complete; native PyTorch is still the only runtime that runs it correctly.",
  spec: [
    { label: 'Parameters', value: '934,356,480' },
    { label: 'Layers', value: '24' },
    { label: 'Hidden size', value: '1,536' },
    { label: 'Attention heads', value: '24' },
    { label: 'Context length', value: '2,048 tokens' },
    { label: 'Vocabulary', value: '16,384' },
    { label: 'Feed-forward', value: 'SwiGLU' },
    { label: 'Normalisation', value: 'RMSNorm' },
    { label: 'Embeddings', value: 'Tied input/output' },
    { label: 'Tokenizer', value: 'Byte-level BPE' },
    { label: 'Precision', value: 'bf16 mixed' },
  ],
  specSource: 'configs/1b.yaml and logs/codexa-900m-base-v1/run_metadata.json',
  loss: [
    { step: 100, loss: 2.3052, ppl: 10.026 },
    { step: 1000, loss: 2.2307, ppl: 9.307 },
    { step: 2000, loss: 2.1706, ppl: 8.765 },
    { step: 3000, loss: 2.1031, ppl: 8.191 },
    { step: 4000, loss: 2.0654, ppl: 7.887 },
    { step: 5000, loss: 2.0311, ppl: 7.623 },
    { step: 6000, loss: 2.0316, ppl: 7.626 },
  ],
  lossCaption:
    'Conversational SFT validation loss, codexa-900m-sft-v2. Read from logs/codexa-900m-sft-v2/train_metrics.jsonl.',
  lossAriaLabel: 'Conversational SFT validation loss falling from 2.31 to 2.03 over 6,000 optimizer steps',
  counters: [
    { value: 7700.7, display: '7,700.7', unit: 'tok/s', label: 'median base throughput' },
    { value: 12920, display: '12,920', unit: 'MiB', label: 'peak reserved VRAM' },
    { value: 10000, display: '10,000', unit: 'steps', label: 'completed base steps' },
    { value: 6000, display: '6,000', unit: 'steps', label: 'completed SFT steps' },
  ],
  caveatLabel: "What it can't do.",
  caveat:
    'Native PyTorch inference works, but conversational quality is still being evaluated. The GGUF/LM Studio export failed its behavioral compatibility gate, so the native checkpoint is the only build that runs correctly.',
};
