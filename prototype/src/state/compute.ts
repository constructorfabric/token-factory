import { reactive } from 'vue';

/**
 * Where the root tenant runs models: compute providers it connects, with a
 * reserved quota, pay-as-you-go, or both. A deployment is sized here: memory,
 * GPUs per replica, throughput, latency and cost come from the model and the
 * GPU chosen. The numbers are planning estimates, confirmed by the benchmark
 * run after deployment.
 */
export interface GpuOffer { type: string; memoryGb: number; perHour: number; speed: number }
export interface ComputeProvider {
  id: string;
  name: string;
  kind: 'GPU cloud' | 'Sovereign cloud' | 'Hyperscaler' | 'Own hardware';
  text: string;
  status: 'connected' | 'available';
  /** Reserved quota (a fixed number of GPUs), pay-as-you-go (no cap), or both. */
  billing: 'quota' | 'payg' | 'both';
  quotaGpus?: number;
  usedGpus: number;
  /** Optional monthly spending cap on pay-as-you-go. */
  paygCap?: number;
  regions: string[];
  gpus: GpuOffer[];
  fields: { id: string; label: string; secret?: boolean; placeholder?: string }[];
}

const H100 = { type: 'NVIDIA H100 80GB', memoryGb: 80, speed: 1 };
const H200 = { type: 'NVIDIA H200 141GB', memoryGb: 141, speed: 1.35 };
const L40S = { type: 'NVIDIA L40S 48GB', memoryGb: 48, speed: 0.45 };
const B200 = { type: 'NVIDIA B200 192GB', memoryGb: 192, speed: 2.1 };
const MI300 = { type: 'AMD MI300X 192GB', memoryGb: 192, speed: 1.2 };
const A100 = { type: 'NVIDIA A100 80GB', memoryGb: 80, speed: 0.6 };

export const providers = reactive<ComputeProvider[]>([
  { id: 'sofia', name: 'Sofia data center', kind: 'Own hardware', text: 'Your Kubernetes cluster with GPU nodes, reached through the in-cluster agent.', status: 'connected', billing: 'quota', quotaGpus: 32, usedGpus: 26, regions: ['Sofia, BG'], gpus: [{ ...H100, perHour: 0 }], fields: [{ id: 'kubeconfig', label: 'Agent token', secret: true }] },
  { id: 'gcore', name: 'Gcore', kind: 'GPU cloud', text: 'Everywhere Inference and GPU Cloud in Europe; reserved capacity with pay-as-you-go above it.', status: 'connected', billing: 'both', quotaGpus: 64, usedGpus: 36, paygCap: 15_000, regions: ['Luxembourg', 'Amsterdam', 'Frankfurt'], gpus: [{ ...H200, perHour: 3.9 }, { ...H100, perHour: 2.7 }, { ...L40S, perHour: 1.6 }], fields: [{ id: 'project', label: 'Project ID', placeholder: '412987' }, { id: 'token', label: 'API token', secret: true }] },
  { id: 'virtuozzo', name: 'Virtuozzo', kind: 'Sovereign cloud', text: 'Sovereign GPU capacity through Virtuozzo Hybrid Infrastructure partners, data kept in-country.', status: 'available', billing: 'payg', usedGpus: 0, regions: ['Germany', 'Switzerland', 'Netherlands'], gpus: [{ ...H100, perHour: 3.1 }, { ...A100, perHour: 2.1 }], fields: [{ id: 'endpoint', label: 'Platform URL', placeholder: 'https://vhi.partner.example' }, { id: 'key', label: 'API key', secret: true }] },
  { id: 'nebius', name: 'Nebius', kind: 'GPU cloud', text: 'H200 and B200 clusters in Finland and France, by the hour or reserved.', status: 'available', billing: 'both', usedGpus: 0, regions: ['Finland', 'France'], gpus: [{ ...B200, perHour: 5.5 }, { ...H200, perHour: 3.5 }], fields: [{ id: 'tenant', label: 'Tenant ID' }, { id: 'key', label: 'Service account key', secret: true }] },
  { id: 'coreweave', name: 'CoreWeave', kind: 'GPU cloud', text: 'Large reserved GPU fleets in the US and Europe.', status: 'available', billing: 'quota', usedGpus: 0, regions: ['US East', 'Sweden'], gpus: [{ ...H200, perHour: 3.8 }, { ...H100, perHour: 2.9 }], fields: [{ id: 'kubeconfig', label: 'Kubeconfig', secret: true }] },
  { id: 'lambda', name: 'Lambda', kind: 'GPU cloud', text: 'On-demand H100 and B200 instances, billed by the minute.', status: 'available', billing: 'payg', usedGpus: 0, regions: ['US West', 'US East'], gpus: [{ ...B200, perHour: 4.9 }, { ...H100, perHour: 2.5 }], fields: [{ id: 'key', label: 'API key', secret: true }] },
  { id: 'aws', name: 'AWS', kind: 'Hyperscaler', text: 'EC2 P5 instances or SageMaker endpoints in your AWS account.', status: 'available', billing: 'payg', usedGpus: 0, regions: ['eu-central-1', 'us-east-1'], gpus: [{ ...H100, perHour: 4.1 }, { ...L40S, perHour: 1.9 }], fields: [{ id: 'role', label: 'IAM role ARN', placeholder: 'arn:aws:iam::…:role/token-factory' }] },
  { id: 'azure', name: 'Microsoft Azure', kind: 'Hyperscaler', text: 'ND H100 v5 virtual machines in your subscription.', status: 'available', billing: 'payg', usedGpus: 0, regions: ['West Europe', 'Sweden Central'], gpus: [{ ...H100, perHour: 4.4 }, { ...MI300, perHour: 4.2 }], fields: [{ id: 'sub', label: 'Subscription ID' }, { id: 'secret', label: 'Client secret', secret: true }] },
]);

export const connectedProviders = () => providers.filter((p) => p.status === 'connected');
export const freeGpus = (p: ComputeProvider) => (p.quotaGpus ? p.quotaGpus - p.usedGpus : Infinity);
export const billingLabel = (p: ComputeProvider) => (p.billing === 'quota' ? `Reserved: ${p.quotaGpus ?? '—'} GPUs` : p.billing === 'payg' ? `Pay as you go${p.paygCap ? `, capped at $${p.paygCap.toLocaleString('en')} a month` : ', no cap'}` : `Reserved ${p.quotaGpus} GPUs, then pay as you go${p.paygCap ? ` up to $${p.paygCap.toLocaleString('en')} a month` : ''}`);

// ---- what can be deployed
export interface Candidate {
  id: string;
  name: string;
  source: 'Hugging Face' | 'Admitted, not deployed' | 'Own registry';
  repo: string;
  /** Parameters in billions; MoE models activate fewer per token. */
  paramsB: number;
  activeB: number;
  context: number;
  license: string;
  gated: boolean;
  capabilities: string[];
  family: string;
}
export const CANDIDATES: Candidate[] = [
  { id: 'qwen3-235b', name: 'Qwen3 235B A22B Instruct', source: 'Hugging Face', repo: 'Qwen/Qwen3-235B-A22B-Instruct-2507', paramsB: 235, activeB: 22, context: 262_144, license: 'Apache-2.0', gated: false, capabilities: ['tools', 'json', 'reasoning', 'code'], family: 'Qwen' },
  { id: 'glm-47', name: 'GLM-4.7', source: 'Admitted, not deployed', repo: 'zai-org/GLM-4.7', paramsB: 355, activeB: 32, context: 200_000, license: 'MIT', gated: false, capabilities: ['tools', 'json', 'reasoning', 'code'], family: 'GLM' },
  { id: 'llama-33-70b', name: 'Llama 3.3 70B Instruct', source: 'Hugging Face', repo: 'meta-llama/Llama-3.3-70B-Instruct', paramsB: 70, activeB: 70, context: 131_072, license: 'Llama 3.3 Community', gated: true, capabilities: ['tools', 'json'], family: 'Llama' },
  { id: 'mistral-small', name: 'Mistral Small 3.2 24B', source: 'Hugging Face', repo: 'mistralai/Mistral-Small-3.2-24B-Instruct-2506', paramsB: 24, activeB: 24, context: 131_072, license: 'Apache-2.0', gated: false, capabilities: ['tools', 'json', 'vision'], family: 'Mistral' },
  { id: 'deepseek-v32', name: 'DeepSeek V3.2', source: 'Hugging Face', repo: 'deepseek-ai/DeepSeek-V3.2', paramsB: 685, activeB: 37, context: 131_072, license: 'MIT', gated: false, capabilities: ['tools', 'json', 'reasoning', 'code'], family: 'DeepSeek' },
  { id: 'acme-ft', name: 'acme-support-qwen-ft', source: 'Own registry', repo: 's3://tf-models/acme/support-qwen-ft-2026-10', paramsB: 32, activeB: 32, context: 65_536, license: 'Apache-2.0 (base)', gated: false, capabilities: ['json'], family: 'Qwen' },
];

export const QUANT = { BF16: 2, FP8: 1, 'INT4 (AWQ)': 0.55 } as const;
export type Quant = keyof typeof QUANT;

export interface Sizing {
  weightsGb: number;
  memoryGb: number;
  gpus: number;
  tpsPerReplica: number;
  concurrency: number;
  ttftMs: number;
  perHour: number;
  perMonth: number;
  costPer1M: number;
}

/** Memory, GPUs, throughput and cost for one replica layout. */
export function size(c: Candidate, gpu: GpuOffer, quant: Quant, gpusOverride?: number, replicas = 1, contextTokens = 32_768): Sizing {
  const weightsGb = c.paramsB * QUANT[quant];
  // weights + KV cache for a working set of sequences + runtime overhead
  const kvGb = (contextTokens / 32_768) * Math.max(4, c.activeB * 0.25);
  const memoryGb = Math.round((weightsGb + kvGb) * 1.15);
  const need = Math.max(1, Math.ceil(memoryGb / (gpu.memoryGb * 0.9)));
  const pow2 = 2 ** Math.ceil(Math.log2(need));
  const gpus = Math.max(gpusOverride ?? pow2, need);
  const quantBoost = quant === 'BF16' ? 1 : quant === 'FP8' ? 1.6 : 1.9;
  const tpsPerReplica = Math.round((1800 * gpus * gpu.speed * quantBoost) / Math.sqrt(c.activeB));
  const concurrency = Math.round(24 * gpus * gpu.speed);
  const ttftMs = Math.round(120 + (c.activeB * 6) / (gpu.speed * quantBoost));
  const perHour = gpus * gpu.perHour * replicas;
  const perMonth = perHour * 730;
  // at a realistic 55% utilization
  const costPer1M = gpu.perHour ? (gpus * gpu.perHour) / (tpsPerReplica * 3600 * 0.55) * 1e6 : 0;
  return { weightsGb: Math.round(weightsGb), memoryGb, gpus, tpsPerReplica, concurrency, ttftMs, perHour, perMonth, costPer1M };
}
