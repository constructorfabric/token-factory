import type {
  Alias,
  ApiKey,
  AuditEvent,
  BenchmarkRun,
  BenchmarkSuite,
  Cluster,
  Deployment,
  Guardrail,
  License,
  Model,
  Point,
  ProviderKey,
  LicenseRequest,
  Tenant,
  Unit,
  User,
} from './types';

// Everything here is invented for the demo. Prices, scores and volumes are
// plausible, not quoted from any provider.

export const ROOT_TENANT_ID = 'root';
export const DEMO_TENANT_ID = 't-acme';
export const DEMO_USER_ID = 'u-jane';

export const tenants: Tenant[] = [
  { id: 'root', name: 'Constructor Fabric TF', parentId: null, tier: 'root', status: 'active', deployment: 'shared', region: 'EU (Frankfurt)', users: 12, seats: 0, units: 0, spend30d: 0, budget30d: 0, tokens30d: 0, models: 18, byok: false, createdAt: '2025-11-03', admin: 'Victor Batraev' },
  { id: 't-gcore-hub', name: 'Gcore Partner Hub', description: 'Gcore’s reseller hub: offers Token Factory to its own cloud customers.', parentId: 'root', tier: 'partner', status: 'active', deployment: 'dedicated', region: 'EU (Luxembourg)', users: 38, seats: 60, units: 4, spend30d: 18420, budget30d: 25000, tokens30d: 1.92e9, models: 11, byok: true, createdAt: '2026-02-11', admin: 'Lena Fischer' },
  { id: 't-northwind', name: 'Northwind Bank', description: 'Retail bank; risk, operations and engineering teams use AI for documents and code.', parentId: 't-gcore-hub', tier: 'customer', status: 'active', deployment: 'dedicated', region: 'EU (Luxembourg)', users: 640, seats: 700, units: 23, spend30d: 41250, budget30d: 50000, tokens30d: 4.1e9, models: 7, byok: true, createdAt: '2026-03-02', admin: 'Marc Dupont' },
  { id: 't-helix', name: 'Helix Pharma', description: 'Pharmaceutical company; research and regulatory teams, models hosted on-premises in Zurich.', parentId: 't-gcore-hub', tier: 'customer', status: 'provisioning', setupDone: false, deployment: 'self-hosted', region: 'CH (Zurich, on-prem)', users: 0, seats: 250, units: 0, spend30d: 0, budget30d: 15000, tokens30d: 0, models: 3, byok: false, createdAt: '2026-10-29', admin: 'Anna Keller' },
  { id: 't-acme', name: 'Acme Corp', description: 'Software company; engineering, product and support use AI for coding and customer replies.', parentId: 'root', tier: 'customer', status: 'active', deployment: 'shared', region: 'EU (Frankfurt)', users: 1240, seats: 1400, units: 18, spend30d: 63980, budget30d: 80000, tokens30d: 7.42e9, models: 12, byok: true, createdAt: '2026-01-15', admin: 'Daniel Novak' },
  { id: 't-globex', name: 'Globex Retail', description: 'Retail chain; store operations and merchandising use AI for summaries and planning.', parentId: 'root', tier: 'customer', status: 'active', deployment: 'shared', region: 'EU (Frankfurt)', users: 410, seats: 500, units: 9, spend30d: 12760, budget30d: 12000, tokens30d: 1.38e9, models: 6, byok: false, createdAt: '2026-04-20', admin: 'Sofia Marin' },
  { id: 't-initech', name: 'Initech Labs', description: 'Applied research lab; data scientists evaluate and build on many models.', parentId: 'root', tier: 'customer', status: 'active', deployment: 'dedicated', region: 'US (Virginia)', users: 215, seats: 250, units: 6, spend30d: 22310, budget30d: 30000, tokens30d: 2.6e9, models: 9, byok: true, createdAt: '2026-05-08', admin: 'Peter Gibbons' },
  { id: 't-contributors', name: 'contributors', description: 'Open-source contributors to Token Factory, with limited free access.', parentId: 'root', tier: 'customer', status: 'active', deployment: 'shared', region: 'EU (Frankfurt)', users: 86, seats: 0, units: 0, spend30d: 0, budget30d: 0, tokens30d: 0.62e9, models: 2, byok: false, createdAt: '2026-11-01', admin: 'Claims rule tf:tenant=contributors' },
  { id: 't-students', name: 'students', description: 'University students in the Constructor education programme.', parentId: 'root', tier: 'customer', status: 'active', deployment: 'shared', region: 'EU (Frankfurt)', users: 1180, seats: 0, units: 0, spend30d: 0, budget30d: 0, tokens30d: 0.95e9, models: 1, byok: false, createdAt: '2026-11-01', admin: 'Claims rule tf:tenant=students' },
  { id: 't-umbrella', name: 'Umbrella Health', description: 'Healthcare provider; contract ended, access suspended.', parentId: 'root', tier: 'customer', status: 'suspended', deployment: 'shared', region: 'EU (Frankfurt)', users: 95, seats: 100, units: 3, spend30d: 1890, budget30d: 5000, tokens30d: 0.21e9, models: 4, byok: false, createdAt: '2026-06-17', admin: 'Alice Abernathy' },
];

export const suites: BenchmarkSuite[] = [
  { id: 'b-coding', name: 'Agentic coding', scenario: 'Multi-file changes in company repositories, verified by unit tests', cases: 240, scoring: 'Unit tests pass', threshold: 70, owner: 'Platform Engineering', version: 'v7', privateData: true },
  { id: 'b-review', name: 'Code review', scenario: 'Find seeded defects in real merge requests', cases: 180, scoring: 'Defects found (exact)', threshold: 65, owner: 'Platform Engineering', version: 'v4', privateData: true },
  { id: 'b-tools', name: 'Tool calling (Claude Code, Codex)', scenario: 'Agent loop through each supported client', cases: 120, scoring: 'Schema-valid calls + task success', threshold: 90, owner: 'Developer Experience', version: 'v3', privateData: false },
  { id: 'b-extract', name: 'Structured extraction', scenario: 'Contracts and invoices to JSON schema', cases: 300, scoring: 'Field-level exact match', threshold: 85, owner: 'Data Platform', version: 'v5', privateData: true },
  { id: 'b-summ', name: 'Document summarization', scenario: 'Summaries of policies and meeting notes', cases: 150, scoring: 'Pinned judge (Claude Opus 5.5 · rubric v2)', threshold: 75, owner: 'Knowledge Team', version: 'v2', privateData: true },
];

export const models: Model[] = [
  { id: 'm-opus-55', name: 'Claude Opus 5.5', provider: 'Anthropic', hosting: 'commercial', family: 'Claude', version: '2026-09', context: 1_000_000, priceIn: 15, priceOut: 75, capabilities: ['tools', 'vision', 'json', 'reasoning', 'long-context', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'assistant-prefill', 'computer-use'], state: 'ga', uptime30d: 99.95, p50Ms: 1180, tps: 62, scores: { 'b-coding': 88, 'b-review': 84, 'b-tools': 98, 'b-extract': 93, 'b-summ': 91 }, dataResidency: 'EU, US', providerKeyId: 'k-root-anthropic' },
  { id: 'm-sonnet-55', name: 'Claude Sonnet 5.5', provider: 'Anthropic', hosting: 'commercial', family: 'Claude', version: '2026-10', context: 1_000_000, priceIn: 3, priceOut: 15, capabilities: ['tools', 'vision', 'json', 'reasoning', 'long-context', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'assistant-prefill', 'computer-use'], state: 'rolling-out', ring: 'pilot', uptime30d: 99.93, p50Ms: 640, tps: 118, scores: { 'b-coding': 84, 'b-review': 79, 'b-tools': 97, 'b-extract': 90, 'b-summ': 87 }, dataResidency: 'EU, US', providerKeyId: 'k-root-anthropic' },
  { id: 'm-sonnet-45', name: 'Claude Sonnet 4.5', provider: 'Anthropic', hosting: 'commercial', family: 'Claude', version: '2025-09', context: 200_000, priceIn: 3, priceOut: 15, capabilities: ['tools', 'vision', 'json', 'reasoning', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'assistant-prefill'], state: 'deprecated', uptime30d: 99.91, p50Ms: 710, tps: 96, retiresOn: '2027-01-15', replacementId: 'm-sonnet-55', scores: { 'b-coding': 77, 'b-review': 72, 'b-tools': 96, 'b-extract': 88, 'b-summ': 84 }, dataResidency: 'EU, US', providerKeyId: 'k-root-anthropic' },
  { id: 'm-haiku-45', name: 'Claude Haiku 4.5', provider: 'Anthropic', hosting: 'commercial', family: 'Claude', version: '2025-10', context: 200_000, priceIn: 1, priceOut: 5, capabilities: ['tools', 'vision', 'json', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'assistant-prefill'], state: 'ga', uptime30d: 99.97, p50Ms: 290, tps: 210, scores: { 'b-coding': 61, 'b-review': 58, 'b-tools': 94, 'b-extract': 86, 'b-summ': 80 }, dataResidency: 'EU, US', providerKeyId: 'k-root-anthropic' },
  { id: 'm-gpt-51', name: 'GPT-5.1', provider: 'OpenAI', hosting: 'commercial', family: 'GPT', version: '2026-08', context: 400_000, priceIn: 2.5, priceOut: 12, capabilities: ['tools', 'vision', 'json', 'reasoning', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.88, p50Ms: 720, tps: 104, scores: { 'b-coding': 82, 'b-review': 76, 'b-tools': 93, 'b-extract': 91, 'b-summ': 85 }, dataResidency: 'EU, US', providerKeyId: 'k-root-openai' },
  { id: 'm-gpt-51-mini', name: 'GPT-5.1 mini', provider: 'OpenAI', hosting: 'commercial', family: 'GPT', version: '2026-08', context: 400_000, priceIn: 0.4, priceOut: 1.6, capabilities: ['tools', 'json', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.9, p50Ms: 310, tps: 190, scores: { 'b-coding': 63, 'b-review': 55, 'b-tools': 91, 'b-extract': 88, 'b-summ': 78 }, dataResidency: 'EU, US', providerKeyId: 'k-root-openai' },
  { id: 'm-gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google', hosting: 'commercial', family: 'Gemini', version: '2026-10', context: 2_000_000, priceIn: 2, priceOut: 10, capabilities: ['tools', 'vision', 'json', 'reasoning', 'long-context', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'verifying', uptime30d: 99.81, p50Ms: 830, tps: 88, scores: { 'b-coding': 81, 'b-review': 74, 'b-tools': 86, 'b-extract': 82 }, dataResidency: 'EU, US', providerKeyId: 'k-root-vertex' },
  { id: 'm-mistral-l3', name: 'Mistral Large 3', provider: 'Mistral', hosting: 'commercial', family: 'Mistral', version: '2026-06', context: 256_000, priceIn: 2, priceOut: 6, capabilities: ['tools', 'json', 'code', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'approved', uptime30d: 99.86, p50Ms: 540, tps: 120, scores: { 'b-coding': 70, 'b-review': 64, 'b-tools': 90, 'b-extract': 87, 'b-summ': 83 }, dataResidency: 'EU' },
  { id: 'm-qwen3-coder', name: 'Qwen3 Coder 480B', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'Qwen', version: 'A35B-FP8', context: 256_000, priceIn: 0.35, priceOut: 1.2, capabilities: ['tools', 'json', 'code', 'long-context', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.62, p50Ms: 410, tps: 140, scores: { 'b-coding': 72, 'b-review': 66, 'b-tools': 92, 'b-extract': 80, 'b-summ': 74 }, dataResidency: 'On-prem (Sofia)' },
  { id: 'm-gpt-oss', name: 'gpt-oss 120B', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'gpt-oss', version: 'MXFP4', context: 128_000, priceIn: 0.15, priceOut: 0.6, capabilities: ['tools', 'json', 'reasoning', 'code', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.55, p50Ms: 260, tps: 230, scores: { 'b-coding': 64, 'b-review': 57, 'b-tools': 89, 'b-extract': 84, 'b-summ': 79 }, dataResidency: 'On-prem (Sofia)' },
  { id: 'm-deepseek-v32', name: 'DeepSeek V3.2', provider: 'Gcore Inference', hosting: 'gpu-provider', family: 'DeepSeek', version: 'V3.2-Exp', context: 128_000, priceIn: 0.28, priceOut: 0.42, capabilities: ['tools', 'json', 'reasoning', 'code', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'verified', uptime30d: 99.4, p50Ms: 520, tps: 95, scores: { 'b-coding': 74, 'b-review': 67, 'b-tools': 84, 'b-extract': 83, 'b-summ': 77 }, dataResidency: 'EU (Luxembourg)' },
  { id: 'm-llama4-mav', name: 'Llama 4 Maverick', provider: 'Gcore Inference', hosting: 'gpu-provider', family: 'Llama', version: '17B-128E', context: 1_000_000, priceIn: 0.22, priceOut: 0.85, capabilities: ['tools', 'vision', 'json', 'long-context', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'failed', uptime30d: 99.2, p50Ms: 480, tps: 150, scores: { 'b-coding': 58, 'b-review': 51, 'b-tools': 78, 'b-extract': 81, 'b-summ': 76 }, dataResidency: 'EU (Luxembourg)' },
  { id: 'm-llama31-70b', name: 'Llama 3.1 70B', provider: 'Self-hosted · TGI', hosting: 'self-hosted', family: 'Llama', version: 'Instruct-AWQ', context: 128_000, priceIn: 0.3, priceOut: 0.4, capabilities: ['tools', 'json', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'retired', uptime30d: 0, p50Ms: 0, tps: 0, retiresOn: '2026-09-30', scores: { 'b-coding': 41, 'b-tools': 70, 'b-extract': 74, 'b-summ': 70 }, dataResidency: 'On-prem (Sofia)' },
  { id: 'm-new-sonnet', name: 'Claude Sonnet 5.5 (2026-11 snapshot)', provider: 'Anthropic', hosting: 'commercial', family: 'Claude', version: '2026-11', context: 1_000_000, priceIn: 3, priceOut: 15, capabilities: ['tools', 'vision', 'json', 'reasoning', 'long-context', 'code', 'web-search', 'prompt-caching', 'system-messages', 'tool-choice', 'assistant-prefill', 'computer-use'], state: 'discovered', uptime30d: 0, p50Ms: 0, tps: 0, scores: {}, dataResidency: 'EU, US' },
  // PRD M1: self-hosted open-weight families GLM and Qwen, admitted through the pipeline.
  { id: 'm-glm-46', name: 'GLM-4.6', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'GLM', version: '4.6-FP8', context: 200_000, priceIn: 0.3, priceOut: 1.1, capabilities: ['tools', 'json', 'reasoning', 'code', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.71, p50Ms: 450, tps: 120, scores: { 'b-coding': 76, 'b-tools': 93, 'b-review': 69 }, dataResidency: 'On-prem (Sofia)', hfId: 'zai-org/GLM-4.6-FP8', modelLicense: 'MIT', gpusRequired: 8,
    admission: { license: { status: 'passed', note: 'MIT — on the allowed-license list' }, security: { status: 'passed', note: 'safetensors only, hashes match, no custom code' }, capacity: { status: 'passed', note: '355 GB in weights cache; fits 8× H100' }, download: { status: 'passed', note: 'Downloaded in 41 min' }, acceptance: { status: 'passed', note: 'Sanity 20/20 · tool probe ok · p50 450 ms' }, benchmark: { status: 'passed', note: 'Terminal Bench 41.2 (eval instance)' } } },
  { id: 'm-glm-47', name: 'GLM-4.7', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'GLM', version: '4.7-FP8', context: 200_000, priceIn: 0.3, priceOut: 1.1, capabilities: ['tools', 'json', 'reasoning', 'code', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'verified', uptime30d: 0, p50Ms: 0, tps: 0, scores: { 'b-coding': 79, 'b-tools': 94 }, dataResidency: 'On-prem (Sofia)', hfId: 'zai-org/GLM-4.7-FP8', modelLicense: 'MIT', gpusRequired: 8,
    admission: { license: { status: 'passed', note: 'MIT — on the allowed-license list' }, security: { status: 'passed', note: 'safetensors only, hashes match, no custom code' }, capacity: { status: 'passed', note: '358 GB in weights cache; fits 8× H100' }, download: { status: 'passed', note: 'Downloaded in 44 min' }, acceptance: { status: 'passed', note: 'Sanity 20/20 · tool probe ok · p50 470 ms' }, benchmark: { status: 'passed', note: 'Terminal Bench 44.8 vs 41.2 for the family default' } } },
  { id: 'm-qwen3-next', name: 'Qwen3-Next 80B A3B', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'Qwen', version: 'Instruct-FP8', context: 256_000, priceIn: 0.12, priceOut: 0.5, capabilities: ['tools', 'json', 'long-context', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.8, p50Ms: 210, tps: 260, scores: { 'b-summ': 80, 'b-extract': 86, 'b-tools': 91 }, dataResidency: 'On-prem (Sofia)', hfId: 'Qwen/Qwen3-Next-80B-A3B-Instruct-FP8', modelLicense: 'Apache-2.0', gpusRequired: 2,
    admission: { license: { status: 'passed', note: 'Apache-2.0' }, security: { status: 'passed', note: 'safetensors only, hashes match' }, capacity: { status: 'passed', note: '82 GB; fits 2× H100' }, download: { status: 'passed', note: 'Downloaded in 12 min' }, acceptance: { status: 'passed', note: 'Sanity 20/20 · tool probe ok · p50 210 ms' }, benchmark: { status: 'passed', note: 'Terminal Bench 28.9' } } },
  { id: 'm-qwen-custom', name: 'Qwen2.5-Coder-32B (community fine-tune)', provider: 'Self-hosted · vLLM', hosting: 'self-hosted', family: 'Qwen', version: 'ft-v3', context: 128_000, priceIn: 0.1, priceOut: 0.3, capabilities: ['code', 'prompt-caching', 'system-messages'], state: 'failed', uptime30d: 0, p50Ms: 0, tps: 0, scores: {}, dataResidency: 'On-prem (Sofia)', hfId: 'qwen-coder-community/Qwen2.5-Coder-32B-ft-v3', modelLicense: 'Unknown', gpusRequired: 2,
    admission: { license: { status: 'passed', note: 'Apache-2.0 declared by the repository' }, security: { status: 'failed', note: 'Requires trust_remote_code: modeling_qwen_ft.py is not on the custom-code allowlist; repository name is 1 edit from an allowlisted publisher (typosquat check)' }, capacity: { status: 'pending', note: 'Not run — blocked by the security stage' }, download: { status: 'pending', note: 'Not run' }, acceptance: { status: 'pending', note: 'Not run' }, benchmark: { status: 'pending', note: 'Not run' } } },
  // Tenant-owned: Acme brings its own key and its own fine-tune.
  { id: 'm-acme-azure-gpt', name: 'GPT-5.1 (Acme Azure OpenAI)', provider: 'Azure OpenAI · BYOK', hosting: 'tenant-byok', family: 'GPT', version: '2026-08', context: 400_000, priceIn: 2.5, priceOut: 12, capabilities: ['tools', 'vision', 'json', 'reasoning', 'code', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.9, p50Ms: 690, tps: 100, scores: { 'b-coding': 82, 'b-tools': 93, 'b-extract': 91 }, dataResidency: 'EU (Acme subscription)', ownerTenantId: 't-acme', providerKeyId: 'k-azure' },
  { id: 'm-acme-openai-o4', name: 'o4-mini (Acme OpenAI)', provider: 'OpenAI · BYOK', hosting: 'tenant-byok', family: 'GPT', version: '2026-04', context: 200_000, priceIn: 1.1, priceOut: 4.4, capabilities: ['tools', 'json', 'reasoning', 'code', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'discovered', uptime30d: 0, p50Ms: 0, tps: 0, scores: {}, dataResidency: 'US (Acme OpenAI org)', ownerTenantId: 't-acme', providerKeyId: 'k-openai' },
  // Partner-owned: Gcore deploys models of its own and offers them in its licenses.
  { id: 'm-gc-llama33', name: 'Llama 3.3 70B (Gcore)', provider: 'Gcore · own deployment', hosting: 'tenant-own', family: 'Llama', version: 'instruct', context: 128_000, priceIn: 0.25, priceOut: 0.6, capabilities: ['tools', 'json', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.7, p50Ms: 420, tps: 140, scores: { 'b-extract': 80, 'b-summ': 77 }, dataResidency: 'EU (Luxembourg)', ownerTenantId: 't-gcore-hub' },
  { id: 'm-gc-mistral', name: 'Mistral Small 3.2 (Gcore)', provider: 'Gcore · own deployment', hosting: 'tenant-own', family: 'Mistral', version: '2506', context: 128_000, priceIn: 0.1, priceOut: 0.3, capabilities: ['tools', 'json', 'prompt-caching', 'system-messages', 'tool-choice', 'parallel-tools'], state: 'ga', uptime30d: 99.8, p50Ms: 260, tps: 210, scores: { 'b-extract': 76, 'b-summ': 74 }, dataResidency: 'EU (Luxembourg)', ownerTenantId: 't-gcore-hub' },
];

export const aliases: Alias[] = [
  { id: 'a-glm', family: 'GLM', name: 'GLM', scenario: 'Model alias (PRD M1) — requests to “GLM” go to its current GLM model', primary: 'm-glm-46', fallbacks: ['m-qwen3-coder', 'm-gpt-oss'], strategy: 'priority', requiredSuites: ['b-coding', 'b-tools'] },
  { id: 'a-qwen', family: 'Qwen', name: 'Qwen-Flash', scenario: 'Model alias (PRD M1)', primary: 'm-qwen3-next', fallbacks: [], strategy: 'priority', requiredSuites: ['b-summ'] },
  { id: 'a-coding', requiredCapabilities: ['tools', 'code', 'web-search'], suiteId: 'b-coding', name: 'coding-default', scenario: 'Agentic coding in Claude Code, Codex and IDEs', primary: 'm-sonnet-45', candidate: 'm-sonnet-55', candidateShare: 25, fallbacks: ['m-gpt-51', 'm-qwen3-coder'], strategy: 'priority', requiredSuites: ['b-coding', 'b-review', 'b-tools'] },
  { id: 'a-reason', requiredCapabilities: ['reasoning'], suiteId: 'b-review', name: 'reasoning-max', scenario: 'Hard analysis and architecture work', primary: 'm-opus-55', fallbacks: ['m-gpt-51'], strategy: 'priority', requiredSuites: ['b-coding', 'b-summ'] },
  { id: 'a-summ', suiteId: 'b-summ', name: 'summarize-fast', scenario: 'Summaries, notes, chat', primary: 'm-haiku-45', fallbacks: ['m-gpt-oss', 'm-gpt-51-mini'], strategy: 'least-latency', requiredSuites: ['b-summ'] },
  { id: 'a-extract', requiredCapabilities: ['json'], suiteId: 'b-extract', name: 'extract-default', scenario: 'Documents to JSON', primary: 'm-gpt-51-mini', fallbacks: ['m-haiku-45', 'm-mistral-l3'], strategy: 'lowest-cost', requiredSuites: ['b-extract'] },
  { id: 'a-local', requiredCapabilities: ['tools', 'code'], suiteId: 'b-coding', name: 'coding-local', scenario: 'Code that may not leave the company network', primary: 'm-qwen3-coder', fallbacks: ['m-gpt-oss'], strategy: 'weighted', requiredSuites: ['b-coding', 'b-tools'] },
];

export const clusters: Cluster[] = [
  { id: 'c-sofia', name: 'Sofia on-prem GPU', location: 'Sofia, BG · company DC', kind: 'on-prem', gpu: 'NVIDIA H100 80GB', gpus: 32, gpusUsed: 26, costHour: 0, status: 'healthy' },
  { id: 'c-gcore-lux', name: 'Gcore Everywhere Inference', location: 'Luxembourg', kind: 'gcore', gpu: 'NVIDIA H200 141GB', gpus: 48, gpusUsed: 30, costHour: 3.9, status: 'healthy' },
  { id: 'c-gcore-ams', name: 'Gcore GPU Cloud', location: 'Amsterdam', kind: 'gcore', gpu: 'NVIDIA L40S 48GB', gpus: 16, gpusUsed: 6, costHour: 1.6, status: 'degraded' },
  { id: 'c-zurich', name: 'Helix on-prem (pending)', location: 'Zurich, CH · customer DC', kind: 'on-prem', gpu: 'NVIDIA H100 80GB', gpus: 16, gpusUsed: 0, costHour: 0, status: 'offline' },
];

export const deployments: Deployment[] = [
  { id: 'd-qwen', modelId: 'm-qwen3-coder', clusterId: 'c-sofia', runtime: 'vLLM', quantization: 'FP8', replicas: 2, minReplicas: 1, maxReplicas: 3, gpusPerReplica: 8, utilization: 81, queue: 4, tps: 2810, status: 'running' },
  { id: 'd-gptoss', modelId: 'm-gpt-oss', clusterId: 'c-sofia', runtime: 'vLLM', quantization: 'MXFP4', replicas: 4, minReplicas: 2, maxReplicas: 6, gpusPerReplica: 2, utilization: 64, queue: 0, tps: 5120, status: 'scaling' },
  { id: 'd-deepseek', modelId: 'm-deepseek-v32', clusterId: 'c-gcore-lux', runtime: 'SGLang', quantization: 'FP8', replicas: 2, minReplicas: 1, maxReplicas: 4, gpusPerReplica: 8, utilization: 47, queue: 0, tps: 1730, status: 'running' },
  { id: 'd-llama4', modelId: 'm-llama4-mav', clusterId: 'c-gcore-lux', runtime: 'vLLM', quantization: 'FP8', replicas: 1, minReplicas: 0, maxReplicas: 2, gpusPerReplica: 8, utilization: 12, queue: 0, tps: 240, status: 'running' },
  { id: 'd-helix', modelId: 'm-gpt-oss', clusterId: 'c-zurich', runtime: 'vLLM', quantization: 'MXFP4', replicas: 0, minReplicas: 1, maxReplicas: 2, gpusPerReplica: 2, utilization: 0, queue: 0, tps: 0, status: 'deploying', tenantId: 't-helix' },
];

export const guardrails: Guardrail[] = [
  { id: 'g-pii', provider: 'Presidio (built in)', appliesTo: 'external', failMode: 'closed', name: 'PII redaction', kind: 'Personal data', description: 'Names, emails, phone numbers, IBANs and national IDs are masked before a request leaves the gateway.', mode: 'redact', stage: 'input', scope: 'platform', enforced: true, enabled: true, hits7d: 18420 },
  { id: 'g-secrets', provider: 'Built in', appliesTo: 'all', failMode: 'closed', name: 'Secrets detection', kind: 'Security', description: 'API keys, private keys and connection strings in prompts or code are blocked.', mode: 'block', stage: 'input', scope: 'platform', enforced: true, enabled: true, hits7d: 312 },
  { id: 'g-injection', provider: 'Lakera (external)', appliesTo: 'all', failMode: 'open', name: 'Prompt injection', kind: 'Security', description: 'Instructions hidden in tool results, documents and web pages are detected.', mode: 'flag', stage: 'input', scope: 'platform', enforced: false, enabled: true, hits7d: 96 },
  { id: 'g-residency', name: 'EU data residency', kind: 'Compliance', description: 'Requests from EU tenants are routed only to models processed in the EU.', mode: 'block', stage: 'input', scope: 'platform', enforced: true, enabled: true, hits7d: 41 },
  { id: 'g-toxic', provider: 'Llama Guard (self-hosted)', appliesTo: 'all', failMode: 'open', name: 'Harmful content', kind: 'Content safety', description: 'Harassment, self-harm and violent content in responses.', mode: 'block', stage: 'output', scope: 'platform', enforced: false, enabled: true, hits7d: 7 },
  { id: 'g-code-egress', name: 'Source code stays internal', kind: 'Security', description: 'Requests tagged with internal repositories go only to self-hosted models.', mode: 'block', stage: 'input', scope: 'tenant', enforced: false, enabled: true, hits7d: 1204, tenantId: 't-acme' },
  { id: 'g-tools', provider: 'Built in', appliesTo: 'all', failMode: 'closed', name: 'Tool policy', kind: 'Tools', description: 'Write and admin tools of MCP servers need the user to confirm; shell tools are blocked for models without a sandbox.', mode: 'block', stage: 'tools', scope: 'platform', enforced: false, enabled: true, hits7d: 214 },
  { id: 'g-topics', provider: 'LLM as judge', appliesTo: 'all', failMode: 'open', name: 'Restricted topics: legal advice', kind: 'Content policy', description: 'Answers that read as legal advice get a disclaimer and are logged.', mode: 'flag', stage: 'output', scope: 'tenant', enforced: false, enabled: false, hits7d: 0, tenantId: 't-acme' },
];

export const benchmarkRuns: BenchmarkRun[] = [
  { id: 'r1', suiteId: 'b-coding', candidateId: 'm-sonnet-55', incumbentId: 'm-sonnet-45', candidateScore: 84, incumbentScore: 77, costDelta: 0, latencyDelta: -10, status: 'passed', at: '2026-10-28T10:12:00Z' },
  { id: 'r2', suiteId: 'b-review', candidateId: 'm-sonnet-55', incumbentId: 'm-sonnet-45', candidateScore: 79, incumbentScore: 72, costDelta: 0, latencyDelta: -8, status: 'passed', at: '2026-10-28T10:40:00Z' },
  { id: 'r3', suiteId: 'b-tools', candidateId: 'm-sonnet-55', incumbentId: 'm-sonnet-45', candidateScore: 97, incumbentScore: 96, costDelta: 0, latencyDelta: -9, status: 'passed', at: '2026-10-28T11:05:00Z' },
  { id: 'r4', suiteId: 'b-coding', candidateId: 'm-gemini-3-pro', incumbentId: 'm-sonnet-45', candidateScore: 81, incumbentScore: 77, costDelta: -31, latencyDelta: 17, status: 'passed', at: '2026-11-05T08:00:00Z' },
  { id: 'r5', suiteId: 'b-tools', candidateId: 'm-gemini-3-pro', incumbentId: 'm-sonnet-45', candidateScore: 86, incumbentScore: 96, costDelta: -31, latencyDelta: 17, status: 'failed', at: '2026-11-05T08:30:00Z' },
  { id: 'r6', suiteId: 'b-extract', candidateId: 'm-gemini-3-pro', incumbentId: 'm-gpt-51-mini', candidateScore: 82, incumbentScore: 88, costDelta: 410, latencyDelta: 168, status: 'failed', at: '2026-11-05T09:00:00Z' },
  { id: 'r7', suiteId: 'b-coding', candidateId: 'm-llama4-mav', incumbentId: 'm-qwen3-coder', candidateScore: 58, incumbentScore: 72, costDelta: -29, latencyDelta: 17, status: 'failed', at: '2026-10-19T13:00:00Z' },
  { id: 'r8', suiteId: 'b-coding', candidateId: 'm-deepseek-v32', incumbentId: 'm-qwen3-coder', candidateScore: 74, incumbentScore: 72, costDelta: -42, latencyDelta: 27, status: 'passed', at: '2026-10-22T09:00:00Z' },
  { id: 'r10', suiteId: 'b-extract', candidateId: 'm-new-sonnet', incumbentId: 'm-sonnet-55', candidateScore: 0, incumbentScore: 90, costDelta: 0, latencyDelta: 0, status: 'running', at: '2026-11-06T07:45:00Z' },
];

export const audit: AuditEvent[] = [
  { id: 'e1', at: '2026-11-06T09:41:00Z', actor: 'Victor Batraev', actorRole: 'Instance Admin', action: 'Moved alias coding-default to ring Pilot (25%)', target: 'Claude Sonnet 5.5', tenantId: 'root', ip: '10.12.4.18', result: 'success' },
  { id: 'e2', at: '2026-11-06T09:12:00Z', actor: 'system', actorRole: 'Lifecycle engine', action: 'Discovered new model version', target: 'Claude Sonnet 5.5 (2026-11 snapshot)', tenantId: 'root', ip: '—', result: 'success' },
  { id: 'e3', at: '2026-11-06T08:30:00Z', actor: 'system', actorRole: 'Benchmark runner', action: 'Verification failed: Tool calling 86 < 90', target: 'Gemini 3 Pro', tenantId: 'root', ip: '—', result: 'failed' },
  { id: 'e4', at: '2026-11-05T16:02:00Z', actor: 'Daniel Novak', actorRole: 'Customer Admin', action: 'Changed default license of Payments team to Developer Pro', target: 'Unit: Payments', tenantId: 't-acme', ip: '84.40.10.7', result: 'success' },
  { id: 'e5', at: '2026-11-05T14:20:00Z', actor: 'Victor Batraev', actorRole: 'Service Engineer', onBehalfOf: 'Acme Corp', action: 'Impersonation started (ticket SUP-4410)', target: 'Tenant Acme Corp', tenantId: 't-acme', ip: '10.12.4.18', result: 'success' },
  { id: 'e6', at: '2026-11-05T11:47:00Z', actor: 'Daniel Novak', actorRole: 'Customer Admin', action: 'Added BYOK key', target: 'Azure OpenAI (acme-prod-weu)', tenantId: 't-acme', ip: '84.40.10.7', result: 'success' },
  { id: 'e7', at: '2026-11-05T10:05:00Z', actor: 'Jane Doe', actorRole: 'User', action: 'Request blocked by guardrail Secrets detection', target: 'coding-default', tenantId: 't-acme', ip: '84.40.22.91', result: 'denied' },
  { id: 'e8', at: '2026-11-04T17:30:00Z', actor: 'Lena Fischer', actorRole: 'Partner Admin', action: 'Created tenant', target: 'Helix Pharma', tenantId: 't-gcore-hub', ip: '91.208.4.2', result: 'success' },
  { id: 'e9', at: '2026-11-04T12:00:00Z', actor: 'Victor Batraev', actorRole: 'Instance Admin', action: 'Scaled deployment 2 → 4 replicas', target: 'gpt-oss 120B · Sofia on-prem GPU', tenantId: 'root', ip: '10.12.4.18', result: 'success' },
  { id: 'e10', at: '2026-11-03T08:15:00Z', actor: 'system', actorRole: 'Budget guard', action: 'Tenant budget exceeded 100% — new requests throttled', target: 'Globex Retail', tenantId: 't-globex', ip: '—', result: 'success' },
  { id: 'e11', at: '2026-11-02T15:40:00Z', actor: 'Victor Batraev', actorRole: 'Instance Admin', action: 'Suspended tenant (unpaid invoice)', target: 'Umbrella Health', tenantId: 't-umbrella', ip: '10.12.4.18', result: 'success' },
  { id: 'e12', at: '2026-11-01T09:00:00Z', actor: 'system', actorRole: 'HR sync', action: 'Synchronized 18 units, 1,240 users from Constructor Platform', target: 'Acme Corp', tenantId: 't-acme', ip: '—', result: 'success' },
];

// ---------------------------------------------------------------- Acme Corp

export const units: Unit[] = [
  { id: 'un-root-ops', tenantId: 'root', name: 'Platform Operations', parentId: null, kind: 'company', manager: 'Victor Batraev', members: 12, defaultLicenseId: 'l-staff', source: 'hr-sync' },
  { id: 'un-root-eng', tenantId: 'root', name: 'Platform Engineering', parentId: 'un-root-ops', kind: 'department', manager: 'Elena Petrova', members: 7, defaultLicenseId: 'l-staff', source: 'hr-sync' },
  { id: 'un-root-support', tenantId: 'root', name: 'Support & Service', parentId: 'un-root-ops', kind: 'department', manager: 'Tomas Kral', members: 4, defaultLicenseId: 'l-root-support', source: 'hr-sync' },
  { id: 'un-acme', tenantId: 't-acme', name: 'Acme Corp', parentId: null, kind: 'company', manager: 'Grace Hopper', members: 1240, defaultLicenseId: 'l-business', source: 'hr-sync' },
  { id: 'un-eng', tenantId: 't-acme', name: 'Engineering', parentId: 'un-acme', kind: 'department', manager: 'Linus Berg', members: 520, defaultLicenseId: 'l-dev-std', source: 'hr-sync' },
  { id: 'un-platform', tenantId: 't-acme', name: 'Platform', parentId: 'un-eng', kind: 'team', manager: 'Ken Thompson', members: 64, defaultLicenseId: 'l-dev-pro', source: 'hr-sync' },
  { id: 'un-payments', tenantId: 't-acme', name: 'Payments', parentId: 'un-eng', kind: 'team', manager: 'Margaret Hamilton', members: 48, defaultLicenseId: 'l-dev-pro', source: 'hr-sync', delegates: ['Jane Doe'] },
  { id: 'un-mobile', tenantId: 't-acme', name: 'Mobile', parentId: 'un-eng', kind: 'team', manager: 'Barbara Liskov', members: 71, defaultLicenseId: null, source: 'hr-sync' },
  { id: 'un-data', tenantId: 't-acme', name: 'Data & ML', parentId: 'un-eng', kind: 'team', manager: 'Frances Allen', members: 39, defaultLicenseId: 'l-dev-pro', source: 'hr-sync' },
  { id: 'un-product', tenantId: 't-acme', name: 'Product', parentId: 'un-acme', kind: 'department', manager: 'Daniel Novak', members: 84, defaultLicenseId: 'l-business', source: 'hr-sync' },
  { id: 'un-sales', tenantId: 't-acme', name: 'Sales', parentId: 'un-acme', kind: 'department', manager: 'Joan Clarke', members: 260, defaultLicenseId: 'l-restricted', source: 'hr-sync' },
  { id: 'un-support', tenantId: 't-acme', name: 'Customer Support', parentId: 'un-acme', kind: 'department', manager: 'Hedy Lamarr', members: 190, defaultLicenseId: 'l-business', source: 'hr-sync' },
  { id: 'un-finance', tenantId: 't-acme', name: 'Finance', parentId: 'un-acme', kind: 'department', manager: 'Ada Byron', members: 46, defaultLicenseId: 'l-restricted', source: 'hr-sync' },
];

export const licenses: License[] = [
  { id: 'l-staff', tenantId: 'root', name: 'Instance staff', description: 'Operators of the instance: every served model, generous limits.', allowedAliases: ['a-glm', 'a-qwen'], allowedModels: ['m-opus-55', 'm-sonnet-55', 'm-gpt-51', 'm-glm-46', 'm-qwen3-next', 'm-qwen3-coder', 'm-haiku-45'], limits: { daily: { tokens: 5_000_000, cost: 50 }, weekly: { tokens: 20_000_000, cost: 200 }, monthly: { tokens: 70_000_000, cost: 700 } }, keyLimits: { daily: 0, weekly: 0, monthly: 0 }, platformAllowed: true, keyRpm: 0, keyMaxContext: 128_000, rpm: 120, maxContext: 1_000_000, guardrailProfile: 'Engineering', holders: 12 },
  { id: 'l-root-support', tenantId: 'root', name: 'Support desk', description: 'Support and service engineers: fast models for triage, moderate limits.', allowedModels: ['m-haiku-45', 'm-gpt-51-mini', 'm-qwen3-next', 'm-gpt-oss'], limits: { daily: { tokens: 5_000_000, cost: 50 }, weekly: { tokens: 20_000_000, cost: 200 }, monthly: { tokens: 70_000_000, cost: 700 } }, keyLimits: { daily: 0, weekly: 0, monthly: 0 }, platformAllowed: true, keyRpm: 0, keyMaxContext: 128_000, rpm: 120, maxContext: 1_000_000, guardrailProfile: 'Engineering', holders: 4 },
  { id: 'l-dev-pro', tenantId: 't-acme', name: 'Developer Pro', description: 'Frontier coding models, Claude Code and Codex, high limits.', allowedModels: ['m-opus-55', 'm-sonnet-55', 'm-sonnet-45', 'm-gpt-51', 'm-qwen3-coder', 'm-haiku-45', 'm-acme-azure-gpt'], limits: { daily: { tokens: 6_000_000, cost: 60 }, weekly: { tokens: 25_000_000, cost: 250 }, monthly: { tokens: 90_000_000, cost: 900 } }, keyLimits: { daily: 30, weekly: 120, monthly: 400 }, platformAllowed: true, keyRpm: 60, keyMaxContext: 400_000, rpm: 120, maxContext: 1_000_000, guardrailProfile: 'Engineering', holders: 151 },
  { id: 'l-dev-std', tenantId: 't-acme', name: 'Developer Standard', description: 'Coding models with a cost-optimised default, self-hosted first.', allowedModels: ['m-sonnet-55', 'm-sonnet-45', 'm-qwen3-coder', 'm-gpt-oss', 'm-haiku-45'], limits: { daily: { tokens: 2_000_000, cost: 20 }, weekly: { tokens: 8_000_000, cost: 80 }, monthly: { tokens: 30_000_000, cost: 300 } }, keyLimits: { daily: 10, weekly: 40, monthly: 150 }, platformAllowed: true, keyRpm: 30, keyMaxContext: 200_000, rpm: 60, maxContext: 256_000, guardrailProfile: 'Engineering', holders: 368 },
  { id: 'l-business', tenantId: 't-acme', name: 'Business User', description: 'Chat, summaries and documents.', allowedModels: ['m-haiku-45', 'm-gpt-51-mini', 'm-gpt-oss'], limits: { daily: { tokens: 400_000, cost: 4 }, weekly: { tokens: 1_500_000, cost: 15 }, monthly: { tokens: 5_000_000, cost: 50 } }, keyLimits: { daily: 0, weekly: 0, monthly: 0 }, platformAllowed: true, keyRpm: 0, keyMaxContext: 128_000, rpm: 30, maxContext: 128_000, guardrailProfile: 'Default', holders: 402 },
  { id: 'l-restricted', tenantId: 't-acme', name: 'Restricted (internal only)', description: 'Self-hosted models only; nothing leaves the company network.', allowedModels: ['m-gpt-oss', 'm-qwen3-coder'], limits: { daily: { tokens: 300_000, cost: 1 }, weekly: { tokens: 1_000_000, cost: 4 }, monthly: { tokens: 3_500_000, cost: 15 } }, keyLimits: { daily: 0, weekly: 0, monthly: 0 }, platformAllowed: true, keyRpm: 0, keyMaxContext: 128_000, rpm: 20, maxContext: 64_000, guardrailProfile: 'Strict', holders: 306 },
];

const u = (tokens: [number, number, number], cost: [number, number, number]) => ({
  daily: { tokens: tokens[0], cost: cost[0] },
  weekly: { tokens: tokens[1], cost: cost[1] },
  monthly: { tokens: tokens[2], cost: cost[2] },
});

export const users: User[] = [
  { id: 'u-elena', tenantId: 'root', name: 'Elena Petrova', email: 'elena.petrova@constructor.tech', unitId: 'un-root-eng', title: 'Head of Platform Engineering', status: 'active', usage: u([410_000, 2_200_000, 8_100_000], [5.1, 24.8, 92.0]), lastActive: '2026-11-06T08:12:00Z', role: 'tenant-admin' },
  { id: 'u-tomas', tenantId: 'root', name: 'Tomas Kral', email: 'tomas.kral@constructor.tech', unitId: 'un-root-support', title: 'Support Engineer', status: 'active', usage: u([90_000, 520_000, 1_900_000], [0.8, 4.4, 16.2]), lastActive: '2026-11-06T07:40:00Z', role: 'user', roles: ['support-engineer'] },
  { id: 'u-aisha', tenantId: 'root', name: 'Aisha Rahman', email: 'aisha.rahman@constructor.tech', unitId: 'un-root-support', title: 'Service Engineer', status: 'active', usage: u([150_000, 800_000, 2_600_000], [1.4, 7.1, 23.9]), lastActive: '2026-11-05T16:02:00Z', role: 'user', roles: ['service-engineer'] },
  { id: 'u-victor', tenantId: 'root', name: 'Victor Batraev', email: 'victor.batraev@constructor.tech', unitId: 'un-root-ops', title: 'Instance Admin', status: 'active', usage: u([620_000, 3_100_000, 11_400_000], [7.9, 36.2, 128.4]), lastActive: '2026-11-06T09:41:00Z', role: 'tenant-admin' },
  { id: 'u-jane', tenantId: 't-acme', name: 'Jane Doe', email: 'jane.doe@acme.example', unitId: 'un-payments', title: 'Senior Backend Engineer', status: 'active', usage: u([4_100_000, 17_900_000, 61_200_000], [38.4, 171.2, 588.9]), lastActive: '2026-11-06T09:38:00Z', role: 'user' },
  { id: 'u-daniel', tenantId: 't-acme', name: 'Daniel Novak', email: 'daniel.novak@acme.example', unitId: 'un-product', title: 'VP Product · Customer Admin', status: 'active', usage: u([120_000, 610_000, 2_300_000], [0.9, 4.8, 17.4]), lastActive: '2026-11-06T08:55:00Z', role: 'tenant-admin' },
  { id: 'u-ken', tenantId: 't-acme', name: 'Ken Thompson', email: 'ken.thompson@acme.example', unitId: 'un-platform', title: 'Engineering Manager', status: 'active', usage: u([2_300_000, 9_800_000, 38_000_000], [22.1, 94.0, 362.5]), lastActive: '2026-11-06T09:10:00Z', role: 'user' },
  { id: 'u-margaret', tenantId: 't-acme', name: 'Margaret Hamilton', email: 'margaret.hamilton@acme.example', unitId: 'un-payments', title: 'Engineering Manager', status: 'active', usage: u([900_000, 4_400_000, 16_100_000], [8.2, 41.0, 150.3]), lastActive: '2026-11-05T18:21:00Z', role: 'user' },
  { id: 'u-raj', tenantId: 't-acme', name: 'Raj Patel', email: 'raj.patel@acme.example', unitId: 'un-mobile', title: 'iOS Engineer', licenseOverrideId: 'l-dev-std', status: 'active', usage: u([1_950_000, 7_000_000, 27_900_000], [19.5, 70.4, 279.0]), lastActive: '2026-11-06T07:59:00Z', role: 'user' },
  { id: 'u-li', tenantId: 't-acme', name: 'Li Wei', email: 'li.wei@acme.example', unitId: 'un-data', title: 'ML Engineer', status: 'active', usage: u([5_800_000, 26_400_000, 84_000_000], [57.0, 262.0, 830.0]), lastActive: '2026-11-06T09:30:00Z', role: 'user' },
  { id: 'u-joan', tenantId: 't-acme', name: 'Joan Clarke', email: 'joan.clarke@acme.example', unitId: 'un-sales', title: 'Head of Sales', status: 'active', usage: u([60_000, 280_000, 1_100_000], [0.2, 0.8, 3.1]), lastActive: '2026-11-05T15:00:00Z', role: 'user' },
  { id: 'u-tom', tenantId: 't-acme', name: 'Tom Becker', email: 'tom.becker@acme.example', unitId: 'un-sales', title: 'Account Executive', status: 'invited', usage: u([0, 0, 0], [0, 0, 0]), lastActive: '', role: 'user' },
  { id: 'u-hedy', tenantId: 't-acme', name: 'Hedy Lamarr', email: 'hedy.lamarr@acme.example', unitId: 'un-support', title: 'Support Lead', status: 'active', usage: u([350_000, 1_310_000, 4_800_000], [3.6, 13.1, 47.9]), lastActive: '2026-11-06T09:02:00Z', role: 'user' },
  { id: 'u-ada', tenantId: 't-acme', name: 'Ada Byron', email: 'ada.byron@acme.example', unitId: 'un-finance', title: 'Finance Controller', status: 'active', usage: u([290_000, 850_000, 3_300_000], [0.9, 3.4, 13.9]), lastActive: '2026-11-04T11:15:00Z', role: 'user' },
  { id: 'u-mark', tenantId: 't-acme', name: 'Mark Ellis', email: 'mark.ellis@acme.example', unitId: 'un-platform', title: 'Contractor', status: 'blocked', usage: u([0, 0, 1_200_000], [0, 0, 11.0]), lastActive: '2026-10-12T10:00:00Z', role: 'user' },
];

// Deterministic extra users for every Acme unit below the company level.
const FIRST = ['Alex', 'Maria', 'Ivan', 'Elena', 'Tom', 'Sara', 'Omar', 'Nina', 'Paul', 'Lena', 'Kai', 'Zoe', 'Igor', 'Mila', 'Dan', 'Eva'];
const LAST = ['Novak', 'Petrova', 'Schmidt', 'Rossi', 'Kowalski', 'Ivanova', 'Dubois', 'Horvat', 'Jensen', 'Silva', 'Popescu', 'Meyer', 'Costa', 'Nagy', 'Berg', 'Lindqvist'];
const TITLES: Record<string, string[]> = {
  'un-platform': ['Platform Engineer', 'SRE', 'Staff Engineer'],
  'un-payments': ['Backend Engineer', 'QA Engineer', 'Engineering Lead'],
  'un-mobile': ['iOS Engineer', 'Android Engineer', 'Mobile QA'],
  'un-data': ['Data Engineer', 'ML Engineer', 'Analyst'],
  'un-eng': ['Engineering Manager', 'Architect', 'Technical Writer'],
  'un-product': ['Product Manager', 'Designer', 'Product Analyst'],
  'un-sales': ['Account Executive', 'Sales Engineer', 'SDR'],
  'un-support': ['Support Engineer', 'Support Specialist', 'Team Lead'],
  'un-finance': ['Accountant', 'Controller', 'Financial Analyst'],
};
let n = 0;
for (const unitId of Object.keys(TITLES)) {
  for (let i = 0; i < 8; i++) {
    n++;
    const first = FIRST[(n * 7) % FIRST.length]!;
    const last = LAST[(n * 11) % LAST.length]!;
    const heavy = ['un-platform', 'un-payments', 'un-data', 'un-mobile'].includes(unitId);
    const weekly = (heavy ? 40 + ((n * 37) % 160) : 1 + ((n * 13) % 12)) * (i === 7 ? 0 : 1);
    users.push({
      id: `u-gen-${n}`,
      tenantId: 't-acme',
      name: `${first} ${last}`,
      email: `${first}.${last}${n}@acme.example`.toLowerCase(),
      unitId,
      title: TITLES[unitId]![i % 3]!,
      licenseOverrideId: i === 5 && heavy ? 'l-dev-pro' : undefined,
      status: i === 7 ? 'invited' : i === 6 && n % 3 === 0 ? 'blocked' : 'active',
      usage: u([weekly * 20_000 / 7, weekly * 20_000, weekly * 80_000], [weekly / 7, weekly, weekly * 3.9]),
      lastActive: i === 7 ? '' : `2026-11-0${1 + (n % 6)}T${String(8 + (n % 9)).padStart(2, '0')}:00:00Z`,
      role: 'user',
    });
  }
}

export const providerKeys: ProviderKey[] = [
  { id: 'k-root-anthropic', tenantId: 'root', provider: 'Anthropic', label: 'constructor-prod', mode: 'byok', endpoint: 'api.anthropic.com', hint: '••••91ab', status: 'valid', addedBy: 'Victor Batraev', addedAt: '2026-01-10' },
  { id: 'k-root-openai', tenantId: 'root', provider: 'OpenAI', label: 'constructor-openai', mode: 'byok', endpoint: 'api.openai.com', hint: '••••4c02', status: 'valid', addedBy: 'Victor Batraev', addedAt: '2026-01-10' },
  { id: 'k-root-vertex', tenantId: 'root', provider: 'Google Vertex AI', label: 'constructor-vertex', mode: 'byok', endpoint: 'europe-west4-aiplatform.googleapis.com', hint: '••••e7d1', status: 'valid', addedBy: 'Victor Batraev', addedAt: '2026-02-03' },
  { id: 'k-anthropic', tenantId: 't-acme', provider: 'Anthropic', label: 'Platform-managed', mode: 'platform', endpoint: 'api.anthropic.com', hint: '—', status: 'valid', addedBy: 'Constructor', addedAt: '2026-01-15' },
  { id: 'k-azure', tenantId: 't-acme', provider: 'Azure OpenAI', label: 'acme-prod-weu', mode: 'byok', endpoint: 'acme-prod-weu.openai.azure.com', hint: '••••3f9a', status: 'valid', addedBy: 'Daniel Novak', addedAt: '2026-11-05' },
  { id: 'k-openai', tenantId: 't-acme', provider: 'OpenAI', label: 'acme-research', mode: 'byok', endpoint: 'api.openai.com', hint: '••••a71c', status: 'expiring', addedBy: 'Daniel Novak', addedAt: '2026-02-01' },
  { id: 'k-google', tenantId: 't-acme', provider: 'Google Vertex AI', label: 'Platform-managed', mode: 'platform', endpoint: 'europe-west4-aiplatform.googleapis.com', hint: '—', status: 'valid', addedBy: 'Constructor', addedAt: '2026-01-15' },
];

export const apiKeys: ApiKey[] = [
  { id: 'akv1', userId: 'u-victor', name: 'Claude Code · workstation', prefix: 'cai-sk-Vb01', models: 'license', expiresAt: '2027-03-01', createdAt: '2026-09-01', lastUsed: '2026-11-06T09:20:00Z', spend30d: 96.1, status: 'active' },
  { id: 'akv2', userId: 'u-victor', name: 'Smoke tests (llm-connectors)', prefix: 'cai-sk-Vb02', models: ['m-glm-46'], expiresAt: '2026-12-15', createdAt: '2026-10-07', lastUsed: '2026-11-05T22:00:00Z', spend30d: 4.2, limit: { cost: 5, period: 'monthly' }, status: 'active' },
  { id: 'ak1', userId: 'u-jane', name: 'Claude Code · laptop', prefix: 'cai-sk-7Fq2', models: 'license', expiresAt: '2027-02-01', createdAt: '2026-08-01', lastUsed: '2026-11-06T09:38:00Z', spend30d: 512.4, status: 'active' },
  { id: 'ak2', userId: 'u-jane', name: 'CI review bot (payments-api)', prefix: 'cai-sk-c91P', models: ['m-sonnet-55'], expiresAt: '2026-12-31', createdAt: '2026-09-14', lastUsed: '2026-11-06T06:12:00Z', spend30d: 71.3, limit: { cost: 100, period: 'monthly' }, status: 'active' },
  { id: 'ak3', userId: 'u-jane', name: 'Old VS Code key', prefix: 'cai-sk-0aZx', models: 'license', expiresAt: null, createdAt: '2026-03-02', lastUsed: '2026-07-30T10:00:00Z', spend30d: 0, status: 'revoked' },
];

// ---------------------------------------------------------------- series

// Deterministic, so every reload of the demo shows the same charts.
function series(days: number, base: number, swing: number, seed: number, weekendDip = 0.55): Point[] {
  const out: Point[] = [];
  const end = new Date('2026-11-06T00:00:00Z');
  let s = seed;
  for (let i = days - 1; i >= 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 6 ? weekendDip : 1;
    const trend = 1 + (days - i) / (days * 4);
    const value = (base + (s / 233280 - 0.5) * swing) * weekend * trend;
    out.push({ label: d.toISOString().slice(5, 10), value: Math.max(0, Math.round(value)) });
  }
  return out;
}

export const platformSpend = series(30, 5200, 1400, 7);
export const platformTokens = series(30, 520, 140, 11); // millions
export const tenantSpend = series(30, 2400, 700, 5);
export const userSpend = series(30, 22, 16, 3, 0.2);
export const latencyP95 = series(30, 1900, 500, 13, 0.9);
export const errorRate = series(30, 42, 30, 17, 1); // basis points

// ---------------------------------------------------------------- personal usage

/** A year of daily spend for the personal heatmap, ending 6 Nov 2026; quiet weeks included. */
export const myDailySpend = series(364, 22, 18, 3, 0.15).map((p, i) => ((i > 140 && i < 154) || (i > 250 && i < 257) ? 0 : p.value));

/** Last 30 days, per model — what OpenRouter calls usage by model. */
export const myByModel: { label: string; value: number; hint?: string; source: 'platform' | 'keys' }[] = [
  { label: 'Claude Sonnet 5.5', value: 312.4, hint: 'coding-default · 41.2M tokens', source: 'platform' },
  { label: 'Claude Opus 5.5', value: 148.9, hint: 'premium grant · 2.1M tokens', source: 'platform' },
  { label: 'GPT-5.1 (Acme Azure)', value: 61.0, hint: 'Azure key acme-prod-weu · 6.3M tokens', source: 'keys' },
  { label: 'Qwen3 Coder 480B', value: 38.2, hint: 'self-hosted · 9.8M tokens', source: 'platform' },
  { label: 'Claude Haiku 4.5', value: 28.4, hint: 'summarize-fast · 1.8M tokens', source: 'platform' },
];

/** Token composition, last 30 days (millions). */
export const myTokenMix = [
  { label: 'Input, uncached', value: 18.9 },
  { label: 'Input, from cache', value: 33.6, hint: 'billed at a tenth' },
  { label: 'Output', value: 6.1 },
  { label: 'Reasoning', value: 2.6 },
];

// ---------------------------------------------------------------- organization usage (same shape as personal usage)

/** A year of daily spend for the instance and for Acme, ending 6 Nov 2026. */
export const platformDaily = series(364, 5200, 1400, 7, 0.55).map((p) => p.value);
export const acmeDaily = series(364, 2100, 700, 5, 0.45).map((p) => p.value);

export const platformByModel: { label: string; value: number; hint?: string; source: 'platform' | 'keys' }[] = [
  { label: 'Claude Sonnet 5.5', value: 48_300, hint: 'coding-default', source: 'platform' },
  { label: 'Claude Sonnet 4.5', value: 31_900, hint: 'deprecated', source: 'platform' },
  { label: 'GPT-5.1', value: 22_400, source: 'platform' },
  { label: "Tenants' own models", value: 19_700, hint: '9 models on tenant keys and deployments', source: 'keys' },
  { label: 'Claude Opus 5.5', value: 17_800, hint: 'premium', source: 'platform' },
  { label: 'Qwen3 Coder 480B', value: 14_200, hint: 'self-hosted', source: 'platform' },
  { label: 'GLM-4.6', value: 9_600, hint: 'self-hosted', source: 'platform' },
  { label: 'Claude Haiku 4.5', value: 7_900, source: 'platform' },
];
export const platformTokenMix = [
  { label: 'Input, uncached', value: 4_120 },
  { label: 'Input, from cache', value: 7_340, hint: 'billed at a tenth' },
  { label: 'Output', value: 1_390 },
  { label: 'Reasoning', value: 610 },
];
export const acmeByModel: { label: string; value: number; hint?: string; source: 'platform' | 'keys' }[] = [
  { label: 'Claude Sonnet 5.5', value: 21_840, hint: 'coding-default (pilot)', source: 'platform' },
  { label: 'Claude Sonnet 4.5', value: 17_320, hint: 'coding-default', source: 'platform' },
  { label: 'GPT-5.1 (Acme Azure)', value: 9_410, hint: 'Azure key acme-prod-weu', source: 'keys' },
  { label: 'Qwen3 Coder 480B', value: 6_230, hint: 'self-hosted', source: 'platform' },
  { label: 'Claude Haiku 4.5', value: 4_980, source: 'platform' },
  { label: 'gpt-oss 120B', value: 2_610, hint: 'self-hosted', source: 'platform' },
  { label: 'o4-mini (Acme OpenAI)', value: 1_240, hint: 'OpenAI key acme-research', source: 'keys' },
];

/** Share of a tenant's credits spent as its own credits (own keys), last 30 days. */
export const tenantKeyShare: Record<string, number> = { 't-acme': 0.38 };

/** License changes users asked for; pending ones wait for their manager or a license manager. */
export const licenseRequests: LicenseRequest[] = [
  { id: 'lr-root1', tenantId: 'root', userId: 'u-tomas', fromLicenseId: 'l-root-support', licenseId: 'l-staff', reason: 'Reproducing customer issues on Opus and Sonnet needs the models they use.', at: '2026-11-10T16:40:00Z', status: 'pending' },
  { id: 'lr-root2', tenantId: 'root', userId: 'u-aisha', fromLicenseId: 'l-root-support', licenseId: 'l-staff', reason: 'On call for deployments; needs every served model to verify rollouts.', at: '2026-11-04T09:30:00Z', status: 'approved', decidedBy: 'Victor Batraev', decidedAt: '2026-11-04T10:02:00Z' },
  { id: 'lr1', tenantId: 't-acme', userId: 'u-raj', fromLicenseId: 'l-dev-std', licenseId: 'l-dev-pro', reason: 'Joining the payments migration; needs Opus for code review.', at: '2026-11-08T15:20:00Z', status: 'pending' },
  { id: 'lr2', tenantId: 't-acme', userId: 'u-joan', fromLicenseId: 'l-restricted', licenseId: 'l-business', reason: 'Wants document summaries for proposals.', at: '2026-11-09T08:05:00Z', status: 'pending' },
  { id: 'lr3', tenantId: 't-acme', userId: 'u-margaret', fromLicenseId: 'l-dev-pro', licenseId: 'l-dev-std', reason: 'Uses mostly chat now; frees a Developer Pro seat for the team.', at: '2026-11-07T10:00:00Z', status: 'pending' },
  { id: 'lr4', tenantId: 't-acme', userId: 'u-ken', fromLicenseId: 'l-dev-std', licenseId: 'l-dev-pro', reason: 'Leads the platform team; reviews most PRs.', at: '2026-11-03T09:12:00Z', status: 'approved', decidedBy: 'Linus Berg', decidedAt: '2026-11-03T11:40:00Z' },
  { id: 'lr5', tenantId: 't-acme', userId: 'u-joan', fromLicenseId: 'l-restricted', licenseId: 'l-dev-std', reason: 'Would like to try coding models.', at: '2026-10-28T14:00:00Z', status: 'declined', decidedBy: 'Grace Hopper', decidedAt: '2026-10-29T08:30:00Z', note: 'Sales does not need coding models; Business User covers summaries.' },
];

// ---------------------------------------------------------------- tenant-owned model reports

export interface OwnModelReport {
  modelId: string;
  requests: number;
  p50Ms: number;
  p95Ms: number;
  ttftMs: number;
  tps: number;
  errorRate: number;
  availability: number;
  /** Tokens by type over 30 days, in millions, with the credit price per 1M for that type. */
  tokens: { type: string; millions: number; creditsPer1M: number; note?: string }[];
  byUnit: { label: string; value: number }[];
  daily: number[];
  gpu?: { hours: number; utilization: number; replicas: number; gpu: string };
  billing: 'byok' | 'own-gpu';
}

export const ownModelReports: OwnModelReport[] = [
  {
    modelId: 'm-acme-azure-gpt', requests: 1_960_000, p50Ms: 690, p95Ms: 2_140, ttftMs: 410, tps: 100, errorRate: 0.48, availability: 99.9,
    tokens: [
      { type: 'Input, uncached', millions: 1_240, creditsPer1M: 250 },
      { type: 'Input, from cache', millions: 2_100, creditsPer1M: 25 },
      { type: 'Cache write', millions: 180, creditsPer1M: 250 },
      { type: 'Output', millions: 320, creditsPer1M: 1_200 },
      { type: 'Reasoning', millions: 210, creditsPer1M: 1_200, note: 'billed as output' },
    ],
    byUnit: [{ label: 'Engineering', value: 3_200 }, { label: 'Data & ML', value: 640 }, { label: 'Product', value: 210 }],
    daily: series(364, 7800, 2600, 23, 0.45).map((p, i) => (i < 9 ? 0 : p.value)),
    billing: 'byok',
  },
];
