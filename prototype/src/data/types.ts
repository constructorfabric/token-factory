export type Id = string;

export type TenantTier = 'root' | 'partner' | 'customer';
export type TenantStatus = 'active' | 'provisioning' | 'suspended';
export type DeploymentMode = 'shared' | 'dedicated' | 'self-hosted';

export type TenantPlan = 'Team' | 'Business' | 'Enterprise';

export interface Tenant {
  id: Id;
  name: string;
  parentId: Id | null;
  tier: TenantTier;
  status: TenantStatus;
  deployment: DeploymentMode;
  region: string;
  users: number;
  seats: number;
  units: number;
  spend30d: number;
  budget30d: number;
  tokens30d: number;
  models: number;
  byok: boolean;
  createdAt: string;
  admin: string;
  description?: string;
  /** The organization license; seats and budget30d above are its size. */
  plan?: TenantPlan;
  licenseEnd?: string;
  ownKeysAllowed?: boolean;
  /** The license lets this tenant create tenants beneath it (partners, resellers). */
  canCreateTenants?: boolean;
  /** Which tenant license it is on (state/tenantLicenses). */
  licenseTypeId?: Id;
  /** False until the tenant admin finishes the setup wizard. */
  setupDone?: boolean;
}

export type ModelHosting = 'commercial' | 'self-hosted' | 'gpu-provider' | 'tenant-byok' | 'tenant-own';

/** One lifecycle for every model, managed like patches (Phase 2 stories §2). */
export type LifecycleState =
  | 'discovered'
  | 'verifying'
  | 'verified'
  | 'failed'
  | 'approved'
  | 'rolling-out'
  | 'ga'
  | 'deprecated'
  | 'retired';

export type Capability =
  | 'tools' | 'tool-choice' | 'parallel-tools' | 'computer-use' | 'web-search'
  | 'vision' | 'json' | 'reasoning' | 'long-context' | 'code' | 'prompt-caching'
  | 'system-messages' | 'assistant-prefill';
/** What a model is for, as LiteLLM's `mode` sorts them. */
export type ModelMode = 'chat' | 'embedding' | 'rerank' | 'image' | 'transcription' | 'speech' | 'moderation';
export type Modality = 'text' | 'image' | 'file' | 'audio' | 'video';

export interface Model {
  id: Id;
  name: string;
  provider: string;
  hosting: ModelHosting;
  family: string;
  version: string;
  context: number;
  priceIn: number;
  priceOut: number;
  /** USD per 1M cached input tokens; unset follows the provider (a tenth of input). */
  priceCachedIn?: number;
  /** USD per 1M cache-write tokens; unset follows the provider (Anthropic 1.25x input, others free). */
  priceCacheWrite?: number;
  capabilities: Capability[];
  /** Unset fields follow the provider's usual profile (data/capabilities profileOf). */
  mode?: ModelMode;
  inputModalities?: Modality[];
  outputModalities?: Modality[];
  maxOutput?: number;
  /** Request parameters the model accepts, as OpenRouter lists them. */
  params?: string[];
  /** A request with a parameter the model does not accept: drop it silently, or refuse with 400. */
  unsupportedParams?: 'drop' | 'reject';
  state: LifecycleState;
  ring?: 'canary' | 'pilot' | 'broad';
  uptime30d: number;
  p50Ms: number;
  tps: number;
  retiresOn?: string;
  /** Deprecated models: what callers should move to before it retires. */
  replacementId?: Id;
  ownerTenantId?: Id;
  /** Benchmark score per suite id, 0-100. */
  scores: Record<Id, number>;
  dataResidency: string;
  /** Hugging Face repository, for open-weight models (PRD FR-C2.1). */
  hfId?: string;
  /** The weights' legal terms, checked at admission (PRD "model license"). */
  modelLicense?: string;
  /** Result of each admission stage (PRD FR-D1..D5). */
  admission?: Partial<Record<AdmissionStage, StageResult>>;
  /** GPUs the model needs to serve, for the promotion capacity check (FR-C14). */
  gpusRequired?: number;
  /** The tenant's provider key a BYOK model is called through. */
  providerKeyId?: Id;
}

export type AdmissionStage = 'license' | 'security' | 'capacity' | 'download' | 'acceptance' | 'benchmark';

export interface StageResult {
  status: 'passed' | 'failed' | 'running' | 'pending' | 'skipped';
  note: string;
}

export interface Alias {
  id: Id;
  name: string;
  scenario: string;
  primary: Id;
  candidate?: Id;
  candidateShare?: number;
  fallbacks: Id[];
  strategy: 'priority' | 'weighted' | 'least-latency' | 'lowest-cost';
  requiredSuites: Id[];
  /** The benchmark scenario (suite) this alias serves; its name is the scenario's name. */
  suiteId?: Id;
  /** Model aliases only: the model family (Model.family) whose models it may point at. */
  family?: string;  /** Scenario aliases: what every model it can route to must be able to do. */
  requiredCapabilities?: Capability[];
}

export interface Cluster {
  id: Id;
  name: string;
  location: string;
  kind: 'on-prem' | 'gcore' | 'cloud';
  gpu: string;
  gpus: number;
  gpusUsed: number;
  costHour: number;
  status: 'healthy' | 'degraded' | 'offline';
}

export interface Deployment {
  id: Id;
  modelId: Id;
  clusterId: Id;
  runtime: 'vLLM' | 'SGLang' | 'TGI' | 'Triton';
  quantization: string;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  gpusPerReplica: number;
  utilization: number;
  queue: number;
  tps: number;
  status: 'running' | 'scaling' | 'deploying' | 'stopped' | 'failed';
  tenantId?: Id;
}

export type GuardrailMode = 'block' | 'redact' | 'flag';

export interface Guardrail {
  id: Id;
  name: string;
  kind: string;
  description: string;
  mode: GuardrailMode;
  stage: 'input' | 'output' | 'both' | 'parallel' | 'tools';
  scope: 'platform' | 'tenant';
  /** The detector behind it: built in, or an external guardrail service. */
  provider?: string;
  /** Which models it covers. */
  appliesTo?: 'all' | 'external' | 'models';
  modelIds?: Id[];
  /** When the detector itself fails: let the request through, or refuse it. */
  failMode?: 'open' | 'closed';
  enforced: boolean;
  enabled: boolean;
  hits7d: number;
  tenantId?: Id;
}

export interface BenchmarkSuite {
  id: Id;
  name: string;
  scenario: string;
  cases: number;
  scoring: string;
  threshold: number;
  owner: string;
  version: string;
  privateData: boolean;
}

export interface BenchmarkRun {
  id: Id;
  suiteId: Id;
  candidateId: Id;
  incumbentId: Id;
  candidateScore: number;
  incumbentScore: number;
  costDelta: number;
  latencyDelta: number;
  status: 'passed' | 'failed' | 'running';
  at: string;
}

export interface AuditEvent {
  id: Id;
  at: string;
  actor: string;
  actorRole: string;
  onBehalfOf?: string;
  action: string;
  target: string;
  tenantId: Id;
  ip: string;
  result: 'success' | 'denied' | 'failed';
}

export interface Unit {
  id: Id;
  tenantId: Id;
  name: string;
  parentId: Id | null;
  kind: 'company' | 'department' | 'team';
  manager: string;
  members: number;
  defaultLicenseId: Id | null;
  source: 'hr-sync' | 'local';
  /** Users the tenant admin delegated to manage this unit, besides its HR manager. */
  delegates?: string[];
}

export type LimitPeriod = 'daily' | 'weekly' | 'monthly';
export type TenantRole = 'tenant-admin' | 'user-manager' | 'license-manager' | 'reports-viewer' | 'support-engineer' | 'service-engineer';

export interface License {
  id: Id;
  tenantId: Id;
  name: string;
  description: string;
  allowedModels: Id[];
  /** Model aliases holders may call; each grants whatever model the alias points at now. */
  allowedAliases?: Id[];
  /** Platform credits: models the platform provides, drawn from the organization license. */
  limits: Record<LimitPeriod, { tokens: number; cost: number }>;
  /** The company's own credits ("Acme-own credits"): models on the tenant's own provider keys and deployments, billed
   *  by the provider to the tenant. 0 means the holder may not use them. */
  keyLimits: Record<LimitPeriod, number>;
  /** Whether holders may use platform models at all (rpm and maxContext above apply to them). */
  platformAllowed: boolean;
  /** Rate and context caps for the company's own models, mirroring rpm and maxContext. */
  keyRpm: number;
  keyMaxContext: number;
  rpm: number;
  maxContext: number;
  guardrailProfile: string;
  /** Users holding it now. Licenses have no seat cap of their own; every
   *  holder takes a seat from the organization's pool (Tenant.seats). */
  holders: number;
}

export interface User {
  id: Id;
  tenantId: Id;
  name: string;
  email: string;
  unitId: Id;
  title: string;
  licenseOverrideId?: Id;
  status: 'active' | 'invited' | 'blocked';
  usage: Record<LimitPeriod, { tokens: number; cost: number }>;
  lastActive: string;
  role: 'user' | 'tenant-admin';
  /** Roles on top of being a user; see state/roles.ts. */
  roles?: TenantRole[];
}

/** A user asking for another license; their unit manager or a license manager decides. */
export interface LicenseRequest {
  id: Id;
  tenantId: Id;
  userId: Id;
  /** The license they hold when asking, and the one they ask for. */
  fromLicenseId?: Id;
  licenseId: Id;
  reason: string;
  at: string;
  status: 'pending' | 'approved' | 'declined';
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export interface ProviderKey {
  id: Id;
  tenantId: Id;
  provider: string;
  label: string;
  mode: 'byok' | 'platform';
  endpoint: string;
  hint: string;
  status: 'valid' | 'expiring' | 'invalid';
  addedBy: string;
  addedAt: string;
}

export interface ApiKey {
  id: Id;
  userId: Id;
  name: string;
  prefix: string;
  models: 'license' | Id[];
  expiresAt: string | null;
  createdAt: string;
  lastUsed: string | null;
  spend30d: number;
  /** A cap for this key alone, in credits (stored as USD) per period. Absent: no key
   *  limit, only the holder's license limits apply (DECOMPOSITION p0 key quota). */
  limit?: { cost: number; period: LimitPeriod } | null;
  status: 'active' | 'revoked' | 'expired';
  /** Model access calls models; a management key calls the Token Factory management API within its scopes. */
  kind?: 'models' | 'management';
  scopes?: string[];
}

export interface Point {
  label: string;
  value: number;
}

// ---------------------------------------------------------------- Phase 2: tools & skills

/** Required, Recommended, Available or Blocked at a level of the organization (ORG-01). */
export type AssignmentLevel = 'required' | 'recommended' | 'available' | 'blocked';

export interface McpServer {
  id: Id;
  name: string;
  publisher: string;
  source: 'official-registry' | 'internal' | 'vendor';
  version: string;
  transport: 'http' | 'stdio';
  tools: { name: string; risk: 'read' | 'write' | 'admin' }[];
  credentials: 'shared' | 'per-user-oauth' | 'none';
  state: LifecycleState;
  scan: string;
  risk: 'low' | 'medium' | 'high';
  /** Registered by a tenant for its own users (FR-171); the instance's registry does not list it. */
  ownerTenantId?: Id;
  url?: string;
}

export interface Skill {
  id: Id;
  name: string;
  description: string;
  version: string;
  requiresMcp: Id[];
}

export interface SkillSet {
  id: Id;
  name: string;
  description: string;
  owner: string;
  version: string;
  skills: Id[];
  state: LifecycleState;
  ring?: 'canary' | 'pilot' | 'broad';
  testsPassed: number;
  testsTotal: number;
  conflicts: number;
  users: number;
}

export interface Assignment {
  id: Id;
  tenantId: Id;
  /** A unit of the tenant, or the tenant itself when null. */
  unitId: Id | null;
  kind: 'mcp' | 'skillset';
  itemId: Id;
  level: AssignmentLevel;
  /** Set by whom: the tenant admin, or a unit's manager within delegated rights. */
  setBy: string;
}
