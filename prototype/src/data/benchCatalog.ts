/**
 * Where benchmarks come from, the way evaluation tools load them:
 * - public registries: Hugging Face datasets, EleutherAI lm-evaluation-harness
 *   tasks, UK AISI Inspect Evals, OpenAI simple-evals, project repositories;
 * - a file you upload (JSONL, CSV or Parquet, one case per row);
 * - a Git repository holding the benchmark as code (Inspect task, promptfoo or
 *   lm-eval YAML), synced on push;
 * - an observability dataset curated from real traces (Langfuse, LangSmith);
 * - cases written by hand.
 * A benchmark is then a dataset, a task (how each case becomes a request),
 * and a scorer (how an answer is judged), with run settings.
 */
export type SourceKind = 'registry' | 'upload' | 'git' | 'observability' | 'manual';
export type ScorerKind = 'exact' | 'choice' | 'regex' | 'json-schema' | 'numeric' | 'unit-tests' | 'rules' | 'judge' | 'pairwise' | 'human';

export const SOURCE_KINDS: { id: SourceKind; label: string; hint: string }[] = [
  { id: 'registry', label: 'Public registry', hint: 'Hugging Face, lm-evaluation-harness, Inspect Evals, simple-evals' },
  { id: 'upload', label: 'Upload a file', hint: 'JSONL, CSV or Parquet; one case per row' },
  { id: 'git', label: 'Git repository', hint: 'Benchmark as code; synced on push' },
  { id: 'observability', label: 'From real traffic', hint: 'A dataset curated in Langfuse or LangSmith' },
  { id: 'manual', label: 'Write cases', hint: 'A handful of cases typed here' },
];

export const SCORERS: { id: ScorerKind; label: string; hint: string }[] = [
  { id: 'exact', label: 'Exact match', hint: 'The answer equals the expected text, after trimming' },
  { id: 'choice', label: 'Multiple choice', hint: 'The chosen letter matches' },
  { id: 'regex', label: 'Pattern', hint: 'A regular expression must match' },
  { id: 'json-schema', label: 'JSON schema', hint: 'Valid against a schema, then fields compared' },
  { id: 'numeric', label: 'Numeric answer', hint: 'Within a tolerance; LaTeX and units normalised' },
  { id: 'unit-tests', label: 'Unit tests in a sandbox', hint: 'Runs the produced code or patch against tests in a container' },
  { id: 'rules', label: 'Verifiable rules', hint: 'Checks the instructions were followed (length, format, keywords)' },
  { id: 'judge', label: 'Model as judge', hint: 'A pinned model scores against a rubric' },
  { id: 'pairwise', label: 'Pairwise judge', hint: 'A pinned model picks the better of two answers' },
  { id: 'human', label: 'Human review', hint: 'Reviewers score a sample in the review queue' },
];

export interface CatalogEntry {
  id: string; name: string; category: string; registry: string; ref: string;
  cases: number; scorer: ScorerKind; metric: string; license: string; note?: string;
}
export const CATALOG: CatalogEntry[] = [
  { id: 'swe-bench-verified', name: 'SWE-bench Verified', category: 'Coding', registry: 'Hugging Face', ref: 'princeton-nlp/SWE-bench_Verified', cases: 500, scorer: 'unit-tests', metric: '% resolved', license: 'MIT' },
  { id: 'terminal-bench', name: 'Terminal-Bench 2', category: 'Coding', registry: 'GitHub', ref: 'laude-institute/terminal-bench', cases: 89, scorer: 'unit-tests', metric: '% tasks solved', license: 'Apache-2.0' },
  { id: 'livecodebench', name: 'LiveCodeBench', category: 'Coding', registry: 'Hugging Face', ref: 'livecodebench/code_generation_lite', cases: 1055, scorer: 'unit-tests', metric: 'pass@1', license: 'CC BY 4.0', note: 'Problems are dated; use only those after a model’s cutoff' },
  { id: 'humaneval-plus', name: 'HumanEval+', category: 'Coding', registry: 'EvalPlus', ref: 'evalplus/humanevalplus', cases: 164, scorer: 'unit-tests', metric: 'pass@1', license: 'Apache-2.0', note: 'Widely seen in training data' },
  { id: 'aider-polyglot', name: 'Aider Polyglot', category: 'Coding', registry: 'GitHub', ref: 'Aider-AI/polyglot-benchmark', cases: 225, scorer: 'unit-tests', metric: '% passed', license: 'MIT' },
  { id: 'mmlu-pro', name: 'MMLU-Pro', category: 'Knowledge', registry: 'Hugging Face', ref: 'TIGER-Lab/MMLU-Pro', cases: 12032, scorer: 'choice', metric: '% correct', license: 'MIT' },
  { id: 'gpqa', name: 'GPQA Diamond', category: 'Knowledge', registry: 'Inspect Evals', ref: 'inspect_evals/gpqa_diamond', cases: 198, scorer: 'choice', metric: '% correct', license: 'CC BY 4.0', note: 'Gated dataset: accept its terms on Hugging Face first' },
  { id: 'simpleqa', name: 'SimpleQA', category: 'Knowledge', registry: 'OpenAI simple-evals', ref: 'openai/simple-evals:simpleqa', cases: 4326, scorer: 'judge', metric: '% correct', license: 'MIT' },
  { id: 'math-500', name: 'MATH-500', category: 'Math', registry: 'Hugging Face', ref: 'HuggingFaceH4/MATH-500', cases: 500, scorer: 'numeric', metric: '% correct', license: 'MIT' },
  { id: 'aime-2025', name: 'AIME 2025', category: 'Math', registry: 'Hugging Face', ref: 'opencompass/AIME2025', cases: 30, scorer: 'numeric', metric: '% correct', license: 'MIT', note: 'Few cases: run several samples per case' },
  { id: 'gsm8k', name: 'GSM8K', category: 'Math', registry: 'lm-evaluation-harness', ref: 'gsm8k', cases: 1319, scorer: 'numeric', metric: '% correct', license: 'MIT', note: 'Saturated: most models score above 90' },
  { id: 'ifeval', name: 'IFEval', category: 'Instruction following', registry: 'Hugging Face', ref: 'google/IFEval', cases: 541, scorer: 'rules', metric: '% instructions followed', license: 'Apache-2.0' },
  { id: 'ruler', name: 'RULER', category: 'Long context', registry: 'GitHub', ref: 'NVIDIA/RULER', cases: 260, scorer: 'exact', metric: '% correct', license: 'Apache-2.0', note: 'Choose the context lengths to test: 32K to 1M' },
  { id: 'longbench-v2', name: 'LongBench v2', category: 'Long context', registry: 'Hugging Face', ref: 'THUDM/LongBench-v2', cases: 503, scorer: 'choice', metric: '% correct', license: 'MIT' },
  { id: 'bfcl', name: 'BFCL v3', category: 'Tool use', registry: 'Hugging Face', ref: 'gorilla-llm/Berkeley-Function-Calling-Leaderboard', cases: 4400, scorer: 'json-schema', metric: '% correct calls', license: 'Apache-2.0' },
  { id: 'tau2', name: 'τ²-bench', category: 'Tool use', registry: 'GitHub', ref: 'sierra-research/tau2-bench', cases: 160, scorer: 'rules', metric: 'pass^1', license: 'MIT', note: 'Simulated user: needs a second model to play the customer' },
  { id: 'arena-hard', name: 'Arena-Hard v2', category: 'Judged quality', registry: 'GitHub', ref: 'lmarena/arena-hard-auto', cases: 500, scorer: 'pairwise', metric: 'win rate vs baseline', license: 'Apache-2.0' },
  { id: 'mt-bench', name: 'MT-Bench', category: 'Judged quality', registry: 'lm-evaluation-harness', ref: 'mt_bench', cases: 80, scorer: 'judge', metric: 'score 1–10', license: 'Apache-2.0' },
  { id: 'mmmu', name: 'MMMU', category: 'Images', registry: 'Hugging Face', ref: 'MMMU/MMMU', cases: 900, scorer: 'choice', metric: '% correct', license: 'Apache-2.0', note: 'Needs a model that takes images' },
  { id: 'docvqa', name: 'DocVQA', category: 'Images', registry: 'Hugging Face', ref: 'lmms-lab/DocVQA', cases: 5349, scorer: 'exact', metric: 'ANLS', license: 'MIT', note: 'Needs a model that takes images' },
  { id: 'global-mmlu', name: 'Global-MMLU (de, fr, ru)', category: 'Multilingual', registry: 'Hugging Face', ref: 'CohereForAI/Global-MMLU', cases: 3000, scorer: 'choice', metric: '% correct', license: 'Apache-2.0' },
  { id: 'harmbench', name: 'HarmBench', category: 'Safety', registry: 'Hugging Face', ref: 'walledai/HarmBench', cases: 400, scorer: 'judge', metric: '% refused', license: 'MIT' },
  { id: 'truthfulqa', name: 'TruthfulQA', category: 'Safety', registry: 'lm-evaluation-harness', ref: 'truthfulqa_mc2', cases: 817, scorer: 'choice', metric: '% truthful', license: 'Apache-2.0', note: 'Widely seen in training data' },
  { id: 'strongreject', name: 'StrongREJECT', category: 'Safety', registry: 'Inspect Evals', ref: 'inspect_evals/strong_reject', cases: 313, scorer: 'judge', metric: 'refusal score', license: 'MIT' },
];

/** Datasets curated from traces in the connected observability tool. */
export const OBS_DATASETS = [
  { id: 'lf-support-golden', name: 'support-replies-golden', tool: 'Langfuse', items: 120, updated: '2026-11-04', fields: ['input', 'expected_output', 'metadata.language'] },
  { id: 'lf-contracts-v3', name: 'contract-extraction-v3', tool: 'Langfuse', items: 300, updated: '2026-10-28', fields: ['input', 'expected_output'] },
  { id: 'lf-coding-hard', name: 'coding-agent-hard-cases', tool: 'Langfuse', items: 64, updated: '2026-11-09', fields: ['input', 'expected_output', 'metadata.repo'] },
];
