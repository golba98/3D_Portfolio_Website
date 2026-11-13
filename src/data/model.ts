import type { LanguageModel } from '../types/content';

// v3 only: configs/250m.yaml and reports/training/evidence/base-500m-report.json.
export const codexa: LanguageModel = {
  projectId: 'llm',
  title: 'Codexa v3',
  heading: 'Built and trained from scratch',
  lede: 'The completed v3 base run started from random initialization. These measurements describe that run, not conversational fine-tuning or the separate NumPy and v1 projects.',
  spec: [
    { label: 'Parameters', value: '248,687,488' },
    { label: 'Layers / hidden width', value: '24 / 896' },
    { label: 'Attention heads', value: '14' },
    { label: 'Training context', value: '2,048 tokens' },
    { label: 'Vocabulary', value: '16,384-token BPE' },
    { label: 'Feed-forward', value: 'SwiGLU · intermediate width 2,432' },
    { label: 'Normalization / positions', value: 'RMSNorm / RoPE' },
    { label: 'Embeddings', value: 'Tied input/output' },
    { label: 'Recorded training precision', value: 'BF16 autocast · FP32 loss' },
  ],
  specSource: 'configs/250m.yaml and reports/training/evidence/base-500m-report.json (v3)',
  counters: [
    { value: 500006912, display: '500,006,912', unit: 'targets', label: 'base-run training targets' },
    { value: 15259, display: '15,259', unit: 'updates', label: 'base-run optimizer updates' },
    { value: 3.048003, display: '3.048003', unit: '', label: 'full-window validation loss' },
    { value: 606208, display: '606,208', unit: 'targets', label: 'full-window validation scope' },
  ],
  caveatLabel: 'Research limits.',
  caveat:
    'The recorded base run completed on 4 November 2026; validation loss does not establish language or mathematics competence. Baseline responses still include repetition, factual errors and incoherence. Mathematics training admission is pending and no public trained weights are available. Experimental longer-context configurations do not establish learned long-context capability.',
};
