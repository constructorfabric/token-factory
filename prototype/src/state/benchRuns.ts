import { reactive } from 'vue';
import type { Id } from '@/data/types';
import { db, modelById, record } from '@/state/db';
import type { ScorerKind, SourceKind } from '@/data/benchCatalog';

/**
 * Individual benchmarks. Most belong to a suite (a suite run runs them all);
 * some stand alone. A standalone or public benchmark has no threshold: its
 * score is evidence, not a gate.
 */
export interface Benchmark {
  id: Id; name: string; description: string; cases: number; metric: string; suiteIds: Id[]; source: 'public' | 'internal'; threshold?: number;
  /** Where its cases come from. */
  origin?: { kind: SourceKind; ref: string; revision?: string; split?: string; format?: string };
  /** How each case becomes a request. */
  task?: { system: string; template: string; tools: 'none' | 'case' | 'mcp'; temperature: number; maxTokens: number; samples: number; sampleSize: number | null };
  /** How an answer is judged. */
  scorer?: { kind: ScorerKind; detail: string; judgeModelId?: string; aggregate: 'mean' | 'pass@1' | 'pass@k' | 'win-rate' };
  owner?: string; version?: string; privateData?: boolean;
}
const REG = (ref: string, registry = 'Hugging Face') => ({ kind: 'registry' as const, ref, revision: 'main', split: 'test', format: registry });
/** The setup of a benchmark: what it stored, else sensible defaults for its kind. */
export function setupOf(b: Benchmark): Required<Pick<Benchmark, 'origin' | 'task' | 'scorer'>> & { owner: string; version: string; privateData: boolean } {
  const SEED: Record<string, Pick<Benchmark, 'origin' | 'scorer'>> = {
    'bm-swe-verified': { origin: REG('princeton-nlp/SWE-bench_Verified'), scorer: { kind: 'unit-tests', detail: 'swebench/sweb.eval.x86_64 · repository tests · 30 min per case', aggregate: 'pass@1' } },
    'bm-terminal': { origin: REG('laude-institute/terminal-bench', 'GitHub'), scorer: { kind: 'unit-tests', detail: 'Task container · task tests', aggregate: 'pass@1' } },
    'bm-repo-changes': { origin: { kind: 'git', ref: 'gitlab.constructor.tech/platform/evals', revision: 'main', format: 'Inspect task: evals/repo_changes.py' }, scorer: { kind: 'unit-tests', detail: 'Repository CI image · pytest', aggregate: 'pass@1' } },
    'bm-mr-defects': { origin: { kind: 'git', ref: 'gitlab.constructor.tech/platform/evals', revision: 'main', format: 'Inspect task: evals/mr_defects.py' }, scorer: { kind: 'exact', detail: 'Defect lines must match', aggregate: 'mean' } },
    'bm-bfcl': { origin: REG('gorilla-llm/Berkeley-Function-Calling-Leaderboard'), scorer: { kind: 'json-schema', detail: 'Call name and arguments compared by AST', aggregate: 'mean' } },
    'bm-tau2': { origin: REG('sierra-research/tau2-bench', 'GitHub'), scorer: { kind: 'rules', detail: 'Final database state matches the goal', aggregate: 'pass@1' } },
    'bm-invoices': { origin: { kind: 'upload', ref: 'invoices-2026-09.jsonl', format: 'JSONL' }, scorer: { kind: 'json-schema', detail: 'schemas/invoice.json · field-level exact', aggregate: 'mean' } },
    'bm-contracts': { origin: { kind: 'observability', ref: 'Langfuse · contract-extraction-v3', format: 'Langfuse dataset' }, scorer: { kind: 'json-schema', detail: 'schemas/contract.json · field-level exact', aggregate: 'mean' } },
    'bm-policies': { origin: { kind: 'upload', ref: 'policy-notes-v2.jsonl', format: 'JSONL' }, scorer: { kind: 'judge', detail: 'Rubric v2: faithful, complete, concise (1–5 each)', judgeModelId: 'm-opus-55', aggregate: 'mean' } },
    'bm-mmlu-pro': { origin: REG('TIGER-Lab/MMLU-Pro'), scorer: { kind: 'choice', detail: 'Letter A–J', aggregate: 'mean' } },
    'bm-gpqa': { origin: REG('inspect_evals/gpqa_diamond', 'Inspect Evals'), scorer: { kind: 'choice', detail: 'Letter A–D', aggregate: 'mean' } },
    'bm-ruler': { origin: REG('NVIDIA/RULER', 'GitHub'), scorer: { kind: 'exact', detail: 'Needle values at 32K–128K', aggregate: 'mean' } },
    'bm-ifeval': { origin: REG('google/IFEval'), scorer: { kind: 'rules', detail: '25 verifiable instruction types', aggregate: 'mean' } },
    'bm-de-support': { origin: { kind: 'observability', ref: 'Langfuse · support-replies-golden', format: 'Langfuse dataset' }, scorer: { kind: 'judge', detail: 'Tone and correctness rubric (1–5)', judgeModelId: 'm-opus-55', aggregate: 'mean' } },
  };
  const seed = SEED[b.id];
  return {
    origin: b.origin ?? seed?.origin ?? { kind: 'manual', ref: `${b.cases} cases written here` },
    task: b.task ?? { system: '', template: '{{input}}', tools: b.suiteIds.includes('b-tools') || b.id === 'bm-tau2' ? 'case' : 'none', temperature: 0, maxTokens: 4096, samples: 1, sampleSize: null },
    scorer: b.scorer ?? seed?.scorer ?? { kind: 'exact', detail: '', aggregate: 'mean' },
    owner: b.owner ?? (b.source === 'internal' ? 'Platform Engineering' : 'Benchmark maintainers'),
    version: b.version ?? 'v1',
    privateData: b.privateData ?? b.source === 'internal',
  };
}
export const BENCHMARKS = reactive<Benchmark[]>([
  { id: 'bm-swe-verified', name: 'SWE-bench Verified', description: 'Real GitHub issues, fixed and checked by the repository’s tests', cases: 500, metric: '% resolved', suiteIds: ['b-coding'], source: 'public' },
  { id: 'bm-terminal', name: 'Terminal-Bench 2', description: 'Multi-step tasks in a real shell', cases: 89, metric: '% tasks solved', suiteIds: ['b-coding'], source: 'public' },
  { id: 'bm-repo-changes', name: 'Company repositories: multi-file changes', description: 'Changes in our own repositories, verified by unit tests', cases: 240, metric: '% tests pass', suiteIds: ['b-coding'], source: 'internal', threshold: 70 },
  { id: 'bm-mr-defects', name: 'Seeded defects in merge requests', description: 'Find defects planted in real merge requests', cases: 180, metric: '% defects found', suiteIds: ['b-review'], source: 'internal', threshold: 65 },
  { id: 'bm-bfcl', name: 'BFCL v3', description: 'Berkeley function-calling leaderboard: single, parallel and multi-turn calls', cases: 400, metric: '% correct calls', suiteIds: ['b-tools'], source: 'public' },
  { id: 'bm-tau2', name: 'τ²-bench', description: 'Agent conversations with tools in airline and retail domains', cases: 160, metric: 'pass^1', suiteIds: ['b-tools'], source: 'public' },
  { id: 'bm-invoices', name: 'Invoices to JSON', description: 'Field-level extraction from scanned invoices', cases: 150, metric: '% exact fields', suiteIds: ['b-extract'], source: 'internal', threshold: 85 },
  { id: 'bm-contracts', name: 'Contracts to JSON', description: 'Parties, terms and dates from contracts', cases: 150, metric: '% exact fields', suiteIds: ['b-extract'], source: 'internal', threshold: 85 },
  { id: 'bm-policies', name: 'Policy and meeting-note summaries', description: 'Judged by a pinned model against a rubric', cases: 150, metric: 'rubric score', suiteIds: ['b-summ'], source: 'internal', threshold: 75 },
  { id: 'bm-mmlu-pro', name: 'MMLU-Pro', description: 'Knowledge and reasoning across 14 subjects', cases: 1200, metric: '% correct', suiteIds: [], source: 'public' },
  { id: 'bm-gpqa', name: 'GPQA Diamond', description: 'Graduate-level science questions', cases: 198, metric: '% correct', suiteIds: [], source: 'public' },
  { id: 'bm-ruler', name: 'RULER 128K', description: 'Retrieval and reasoning over long contexts', cases: 260, metric: '% correct', suiteIds: [], source: 'public' },
  { id: 'bm-ifeval', name: 'IFEval', description: 'Following verifiable formatting instructions', cases: 540, metric: '% instructions followed', suiteIds: [], source: 'public' },
  { id: 'bm-de-support', name: 'German customer-support replies', description: 'Tone and correctness of replies to real (anonymised) tickets', cases: 120, metric: 'rubric score', suiteIds: [], source: 'internal', threshold: 70 },
]);
export const benchmarkById = (id: Id) => BENCHMARKS.find((b) => b.id === id);
/** The display name of whatever a run ran: a suite or a single benchmark. */
export const targetName = (id: Id) => db.suites.find((s) => s.id === id)?.name ?? benchmarkById(id)?.name ?? id;

/**
 * Every benchmark run of a model, per suite, newest first. Seeded from the
 * model's current scores with two earlier runs each; a new run is queued,
 * runs, and on finishing becomes the model's score for that suite, which is
 * what alias gates and coverage read.
 */
export interface SuiteRun { id: string; kind: 'suite' | 'benchmark'; modelId: Id; /** The suite or benchmark run. */ suiteId: Id; suiteVersion: string; at: string; status: 'queued' | 'running' | 'passed' | 'failed' | 'done'; score?: number; threshold?: number; costUsd: number; durationMin: number; by: string }

const runs = reactive<Record<Id, SuiteRun[]>>({});

function seed(modelId: Id): SuiteRun[] {
  const m = modelById(modelId);
  if (!m) return [];
  const out: SuiteRun[] = [];
  let n = 0;
  for (const [suiteId, score] of Object.entries(m.scores)) {
    const s = db.suites.find((x) => x.id === suiteId);
    if (!s) continue;
    const v = Number(s.version.replace(/\D/g, '')) || 1;
    [0, 1, 2].forEach((age) => {
      const sc = age === 0 ? score : Math.max(0, score - age * 2 - ((n + age) % 3));
      out.push({
        id: `br-${modelId}-${suiteId}-${age}`, kind: 'suite', modelId, suiteId, suiteVersion: `v${Math.max(1, v - (age === 2 ? 1 : 0))}`,
        at: new Date(Date.UTC(2026, 10, 8 - age * 11 - (n % 4), 3 + n)).toISOString(),
        status: sc >= s.threshold ? 'passed' : 'failed', score: sc, threshold: s.threshold,
        costUsd: Math.round(s.cases * (0.35 + (n % 3) * 0.1)), durationMin: Math.round(s.cases / 6) + n * 2, by: age === 1 ? 'Victor Batraev' : 'Nightly schedule',
      });
    });
    n++;
  }
  // A couple of standalone public benchmarks, run once, for models that have been benchmarked at all.
  if (out.length) {
    ['bm-mmlu-pro', 'bm-gpqa'].forEach((id, i) => {
      const b = benchmarkById(id)!;
      out.push({ id: `br-${modelId}-${id}`, kind: 'benchmark', modelId, suiteId: id, suiteVersion: 'v1', at: new Date(Date.UTC(2026, 9, 30 - i * 3, 9)).toISOString(), status: 'done', score: Math.round(55 + ((m.id.length * 7 + i * 11) % 30)), costUsd: Math.round(b.cases * 0.2), durationMin: Math.round(b.cases / 10), by: 'Victor Batraev' });
    });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export function runsOf(modelId: Id): SuiteRun[] {
  if (!runs[modelId]) runs[modelId] = seed(modelId);
  return runs[modelId]!;
}

/** Cost of running these suites once against a model, in USD. */
export const estimateUsd = (suiteIds: Id[], benchmarkIds: Id[] = []) =>
  suiteIds.reduce((s, id) => s + Math.round((db.suites.find((x) => x.id === id)?.cases ?? 0) * 0.45), 0) + benchmarkIds.reduce((s, id) => s + Math.round((benchmarkById(id)?.cases ?? 0) * 0.2), 0);

export function startRuns(modelId: Id, suiteIds: Id[], by: string, onDone?: (r: SuiteRun) => void, benchmarkIds: Id[] = []): void {
  const m = modelById(modelId);
  if (!m) return;
  const list = runsOf(modelId);
  for (const suiteId of suiteIds) {
    const s = db.suites.find((x) => x.id === suiteId)!;
    const run: SuiteRun = { id: `br-${Date.now().toString(36)}-${suiteId}`, kind: 'suite', modelId, suiteId, suiteVersion: s.version, at: new Date().toISOString(), status: 'queued', threshold: s.threshold, costUsd: Math.round(s.cases * 0.45), durationMin: Math.round(s.cases / 6), by };
    list.unshift(run);
    const live = list.find((x) => x.id === run.id)!;
    setTimeout(() => (live.status = 'running'), 600);
    setTimeout(() => {
      const prev = m.scores[suiteId];
      const score = Math.max(0, Math.min(100, Math.round((prev ?? 55 + (suiteId.length * 7) % 30) + ((Date.now() % 7) - 3))));
      live.score = score;
      live.status = score >= s.threshold ? 'passed' : 'failed';
      m.scores[suiteId] = score;
      onDone?.(live);
    }, 2400 + Math.random() * 1200);
  }
  for (const id of benchmarkIds) {
    const b = benchmarkById(id)!;
    const run: SuiteRun = { id: `br-${Date.now().toString(36)}-${id}`, kind: 'benchmark', modelId, suiteId: id, suiteVersion: 'v1', at: new Date().toISOString(), status: 'queued', threshold: b.threshold, costUsd: Math.round(b.cases * 0.2), durationMin: Math.round(b.cases / 10), by };
    list.unshift(run);
    const live = list.find((x) => x.id === run.id)!;
    setTimeout(() => (live.status = 'running'), 600);
    setTimeout(() => {
      live.score = Math.round(50 + ((Date.now() + id.length * 13) % 45));
      live.status = b.threshold === undefined ? 'done' : live.score >= b.threshold ? 'passed' : 'failed';
      onDone?.(live);
    }, 2000 + Math.random() * 1500);
  }
  const total = suiteIds.length + benchmarkIds.length;
  record({ actor: by, actorRole: 'Instance Admin', action: `Started ${total} benchmark ${total === 1 ? 'run' : 'runs'} on ${m.name}`, target: m.name, tenantId: 'root' });
}

// ---- across models: what the Benchmarks pages read
/** Models benchmarks run against: the instance catalog, admitted and not retired. */
export const benchModels = () => db.models.filter((m) => !m.ownerTenantId && !['retired', 'discovered'].includes(m.state));
/** Every run of one suite or benchmark, across models, newest first. */
export const runsFor = (targetId: Id) => benchModels().flatMap((m) => runsOf(m.id)).filter((r) => r.suiteId === targetId).sort((a, b) => b.at.localeCompare(a.at));
export const recentRuns = (n: number) => benchModels().flatMap((m) => runsOf(m.id)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, n);
/** A model's latest finished result on a suite or benchmark. */
export const latestResult = (modelId: Id, targetId: Id) => runsOf(modelId).find((r) => r.suiteId === targetId && r.score !== undefined && !['queued', 'running'].includes(r.status));
export const membersOf = (suiteId: Id) => BENCHMARKS.filter((b) => b.suiteIds.includes(suiteId));
