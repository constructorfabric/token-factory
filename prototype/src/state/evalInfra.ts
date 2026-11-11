import { reactive } from 'vue';
import type { Id } from '@/data/types';
import { benchModels, runsOf } from '@/state/benchRuns';

/**
 * Where benchmarks run and what keeps them running: the evaluation
 * environment that serves candidate models, sandboxes for scorers that run
 * code, pinned judges, dataset storage, the queue, schedules and the budget.
 */
export const evalSetup = reactive({
  // Model calls of a run
  environment: 'eval-instance' as 'eval-instance' | 'shared-low-priority',
  clusterId: 'c-sofia', gpusReserved: 8, scaleToZero: true,
  apiRateShare: 10,
  // Sandboxes for unit tests, agent tasks and code execution
  sandboxRuntime: 'kubernetes' as 'kubernetes' | 'docker',
  namespace: 'tf-eval-sandboxes', maxSandboxes: 48, cpuPerSandbox: 2, memGbPerSandbox: 4, caseTimeoutMin: 30,
  egress: 'off' as 'off' | 'allowlist' | 'open', egressAllowlist: 'pypi.org, registry.npmjs.org, github.com',
  imageAllowlist: ['swebench/sweb.eval.x86_64:*', 'ghcr.io/laude-institute/terminal-bench:*', 'registry.constructor.tech/evals/*'],
  // Judges
  judgeIds: ['m-opus-55', 'm-gpt-51'] as Id[], judgeShare: 20,
  // Datasets and results
  bucket: 's3://tf-evals/datasets', cacheRegistry: true, keepOutputsDays: 90, privateOnSelfHostedOnly: true,
  // Queue
  maxConcurrentRuns: 6, perModelConcurrency: 2, priorities: ['Admission', 'Gate before promotion', 'Scheduled', 'Manual'],
  // Budget
  monthlyBudgetUsd: 4000, perRunCapUsd: 400, alertAtPct: 80,
});

export interface Schedule { id: Id; name: string; targets: Id[]; models: 'ga' | 'candidates' | 'all' | 'picked'; modelIds: Id[]; when: string; enabled: boolean; lastRun?: string; nextRun: string }
export const schedules = reactive<Schedule[]>([
  { id: 'sch-nightly', name: 'Nightly regression', targets: ['b-coding', 'b-tools', 'b-extract'], models: 'ga', modelIds: [], when: 'Every day at 03:00 UTC', enabled: true, lastRun: '2026-11-11T03:00:00Z', nextRun: '2026-11-12T03:00:00Z' },
  { id: 'sch-weekly-public', name: 'Weekly public benchmarks', targets: ['bm-mmlu-pro', 'bm-gpqa', 'bm-ifeval'], models: 'all', modelIds: [], when: 'Sundays at 02:00 UTC', enabled: true, lastRun: '2026-11-09T02:00:00Z', nextRun: '2026-11-16T02:00:00Z' },
  { id: 'sch-candidates', name: 'Candidates every 6 hours', targets: ['b-coding', 'b-review', 'b-tools', 'b-summ'], models: 'candidates', modelIds: [], when: 'Every 6 hours', enabled: false, nextRun: '2026-11-11T18:00:00Z' },
]);
/** Runs that start by themselves when something changes. */
export const triggers = reactive([
  { id: 'tr-admission', label: 'A model enters admission', what: 'Its scenario suites, as the benchmark stage', enabled: true },
  { id: 'tr-candidate', label: 'A model becomes an alias candidate', what: 'The alias gate: everything the current model passes', enabled: true },
  { id: 'tr-suite-version', label: 'A suite gets a new version', what: 'That suite on every model that passes the old version', enabled: true },
  { id: 'tr-model-version', label: 'A provider updates a model snapshot', what: 'Every suite the model is gated on', enabled: false },
]);

/** Live jobs across models, from the run history. */
export const liveJobs = () => benchModels().flatMap((m) => runsOf(m.id).filter((r) => r.status === 'queued' || r.status === 'running'));

/** Infrastructure failures of recent runs (not low scores): retried by the runner. */
export const infraFailures = [
  { at: '2026-11-11T03:42:00Z', job: 'Agentic coding · Qwen3 Coder 480B', reason: 'Sandbox timed out after 30 min on 3 cases', outcome: 'Cases retried, passed' },
  { at: '2026-11-11T03:18:00Z', job: 'Tool calling · GPT-5.1', reason: 'Provider rate limit (429) — eval share of 10% reached', outcome: 'Backed off 40 s, finished' },
  { at: '2026-11-10T21:05:00Z', job: 'SWE-bench Verified · DeepSeek V3.2', reason: 'Image pull denied: not on the image allowlist', outcome: 'Failed — allowlist needs swebench/*' },
  { at: '2026-11-10T03:31:00Z', job: 'Document summarization · GLM-4.6', reason: 'Judge Claude Opus 5.5 returned 529 overloaded', outcome: 'Judged by fallback judge GPT-5.1' },
  { at: '2026-11-09T02:44:00Z', job: 'MMLU-Pro · Llama 4 Maverick', reason: 'Eval GPU pool full; waited 22 min in the queue', outcome: 'Finished' },
];

/** Month to date. */
export const evalSpend = { usd: 2310, runs: 186, gpuHours: 412, sandboxHours: 1290, judgeUsd: 380 };
export const evalDaily = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 13 + i));
  const sunday = d.getUTCDay() === 0;
  return { label: d.toISOString().slice(5, 10), value: Math.round((sunday ? 22 : 6) + ((i * 7) % 5) + (i > 24 ? 3 : 0)) };
});
