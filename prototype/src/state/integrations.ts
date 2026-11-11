import { reactive } from 'vue';
import type { Id } from '@/data/types';

/**
 * A tenant's integrations. User sources bring users, departments, teams
 * and managers; only one may be active at a time, because the organization
 * cannot have two masters.
 */
export type IntegrationKind = 'users' | 'identity' | 'models' | 'observability' | 'security';

/** A credential or setting a tool integration asks for. */
export interface ToolField { id: string; label: string; placeholder?: string; hint?: string; secret?: boolean; optional?: boolean; value?: string }
export type IntegrationStatus = 'connected' | 'paused' | 'available';

export interface SyncRun {
  at: string;
  result: 'success' | 'partial' | 'failed';
  note: string;
}

export interface Integration {
  id: Id;
  name: string;
  vendor: string;
  kind: IntegrationKind;
  description: string;
  /** What credentials the setup asks for. */
  auth: 'oauth' | 'api-key' | 'scim' | 'token';
  /** Tools only: what Token Factory sends to it, or uses it for. */
  sends?: string[];
  fields?: ToolField[];
  /** PRD placement, for the badge. */
  prd: 'Future' | 'M2' | 'Proposed';
  prdNote: string;
  status: IntegrationStatus;
  account?: string;
  /** Where Token Factory connects, and the credentials it uses (secret kept masked). */
  url?: string;
  clientId?: string;
  secretHint?: string;
  lastTest?: { at: string; ok: boolean; ms: number };
  syncs: { users: boolean; units: boolean; managers: boolean; deactivate: boolean };
  schedule: 'hourly' | 'daily' | 'manual';
  lastSync?: string;
  people?: number;
  units?: number;
  history: SyncRun[];
}

const base = (o: Partial<Integration> & Pick<Integration, 'id' | 'name' | 'vendor' | 'kind' | 'description' | 'auth' | 'prd' | 'prdNote'>): Integration => ({
  status: 'available',
  syncs: { users: true, units: true, managers: true, deactivate: true },
  schedule: 'hourly',
  history: [],
  ...o,
});

function catalog(tenantId: Id): Integration[] {
  // Only Acme starts with its user source connected; every other tenant starts from scratch.
  const acme = tenantId === 't-acme';
  return [
    base({
      id: 'constructor-platform', name: 'Constructor Platform', vendor: 'Constructor', kind: 'users', auth: 'oauth',
      description: 'Departments, teams, users and managers from your Constructor Platform tenant — which takes them from your HR system.',
      prd: 'Future', prdNote: 'Org sync from Constructor Platform is FR-K5 (future direction); the org hierarchy is FR-B9 (M3).',
      // The live connection only Acme has at the start of the demo.
      ...(acme ? {
        status: 'connected' as const, account: 'Constructor Platform tenant “acme”', url: 'https://acme.constructor.app', clientId: 'tf-sync-acme-7c41e0', secretHint: '••••••••••••3f2a',
        lastTest: { at: '2026-11-09T09:40:00Z', ok: true, ms: 182 }, lastSync: '2026-11-09T09:48:00Z', people: 1240, units: 18,
        history: [
          { at: '2026-11-09T09:48:00Z', result: 'success', note: 'No changes' },
          { at: '2026-11-09T08:48:00Z', result: 'success', note: '2 users moved unit; their default license changed' },
          { at: '2026-11-09T07:48:00Z', result: 'success', note: '1 user joined Payments; 1 deactivated in Sales' },
          { at: '2026-11-08T22:48:00Z', result: 'partial', note: '1 user skipped: no email address' },
        ],
      } : {}),
    }),
    base({ id: 'bamboohr', name: 'BambooHR', vendor: 'BambooHR', kind: 'users', auth: 'api-key', description: 'Employees, departments, divisions and reporting lines straight from BambooHR.', prd: 'Proposed', prdNote: 'PRD FR-K5: Token Factory never connects to HR systems itself; HR data arrives through Constructor Platform.' }),
    base({ id: 'workday', name: 'Workday', vendor: 'Workday', kind: 'users', auth: 'oauth', description: 'Workers, supervisory organizations and managers from Workday HCM.', prd: 'Proposed', prdNote: 'Direct HR connectors are not in the PRD.' }),
    base({ id: 'hibob', name: 'HiBob', vendor: 'HiBob', kind: 'users', auth: 'api-key', description: 'Users, departments and teams from HiBob.', prd: 'Proposed', prdNote: 'Direct HR connectors are not in the PRD.' }),
    base({ id: 'personio', name: 'Personio', vendor: 'Personio', kind: 'users', auth: 'api-key', description: 'Employees and departments from Personio.', prd: 'Proposed', prdNote: 'Direct HR connectors are not in the PRD.' }),
    ...(tenantId === 'root' ? [base({
      id: 'huggingface', name: 'Hugging Face', vendor: 'Hugging Face', kind: 'models', auth: 'token', prd: 'M2', prdNote: 'Model admission downloads from Hugging Face (FR-C2.1).',
      description: 'Where open-weight models come from. A token lets admission download gated and private models, and checks each model’s license and card.',
      sends: ['Download gated models', 'Download private models of your organization', 'Read model cards and licenses'],
      fields: [{ id: 'token', label: 'Access token', placeholder: 'hf_…', secret: true, hint: 'A read token is enough; fine-grained tokens can be limited to your organization.' }, { id: 'org', label: 'Organization', placeholder: 'constructor-ai', optional: true }],
      status: 'connected', account: 'huggingface.co/constructor-ai', clientId: 'constructor-ai', secretHint: '••••••••••••Qx7w', lastTest: { at: '2026-11-10T07:12:00Z', ok: true, ms: 211 }, url: 'https://huggingface.co',
    })] : []),
    base({
      id: 'langfuse', name: 'Langfuse', vendor: 'Langfuse', kind: 'observability', auth: 'token', prd: 'M2', prdNote: 'Call metadata to Langfuse is in the design for tracing.',
      description: 'Open-source LLM tracing. Every call through Token Factory appears as a trace with model, tokens, credits and latency.',
      sends: ['Traces of every call', 'Token and credit usage', 'Prompt and response content (only if content logging is on)'],
      fields: [{ id: 'host', label: 'Host URL', placeholder: 'https://cloud.langfuse.com' }, { id: 'public', label: 'Public key', placeholder: 'pk-lf-…' }, { id: 'secret', label: 'Secret key', placeholder: 'sk-lf-…', secret: true }],
    }),
    base({
      id: 'langsmith', name: 'LangSmith', vendor: 'LangChain', kind: 'observability', auth: 'token', prd: 'Proposed', prdNote: 'Not in the PRD.',
      description: 'Tracing and evaluation for LangChain and LangGraph apps. Calls made through Token Factory join the traces your developers already have.',
      sends: ['Traces of every call', 'Token and credit usage'],
      fields: [{ id: 'host', label: 'Endpoint URL', value: 'https://api.smith.langchain.com' }, { id: 'project', label: 'Project', placeholder: 'token-factory' }, { id: 'key', label: 'API key', placeholder: 'lsv2_…', secret: true }],
    }),
    base({
      id: 'datadog', name: 'Datadog', vendor: 'Datadog', kind: 'observability', auth: 'token', prd: 'Proposed', prdNote: 'Not in the PRD.',
      description: 'Metrics and logs for your operations team: requests, errors, latency and credits per model and license.',
      sends: ['Metrics', 'Request logs (no content)'],
      fields: [{ id: 'site', label: 'Site URL', value: 'https://api.datadoghq.eu' }, { id: 'key', label: 'API key', secret: true }],
    }),
    base({
      id: 'prometheus', name: 'Prometheus & Grafana', vendor: 'Prometheus', kind: 'observability', auth: 'token', prd: 'Proposed', prdNote: 'Not in the PRD.',
      description: 'A metrics endpoint your Prometheus scrapes, with a ready-made Grafana dashboard.',
      sends: ['Metrics'],
      fields: [{ id: 'url', label: 'Scrape URL', value: 'https://tf.constructor.tech/metrics' }, { id: 'token', label: 'Bearer token', secret: true, hint: 'Generated for you; paste it into your Prometheus job.' , value: 'tfm_8f2c91d4' }],
    }),
    base({
      id: 'splunk', name: 'Splunk', vendor: 'Splunk', kind: 'security', auth: 'token', prd: 'Proposed', prdNote: 'Not in the PRD.',
      description: 'Your audit log in your SIEM, as it happens: sign-ins, key changes, license changes and support sessions.',
      sends: ['Audit log events', 'Sign-in events'],
      fields: [{ id: 'url', label: 'HTTP Event Collector URL', placeholder: 'https://splunk.example.com:8088' }, { id: 'token', label: 'HEC token', secret: true }],
    }),
    base({ id: 'entra', name: 'Microsoft Entra ID', vendor: 'Microsoft', kind: 'identity', auth: 'scim', description: 'Users and groups pushed over SCIM; removal in Entra revokes keys within a minute.', prd: 'M2', prdNote: 'SCIM and directory sync (FR-B3.3, FR-B11) are M2.' }),
    base({ id: 'okta', name: 'Okta', vendor: 'Okta', kind: 'identity', auth: 'scim', description: 'Users and groups pushed over SCIM from Okta.', prd: 'M2', prdNote: 'SCIM provisioning (FR-B11) is M2.' }),
    base({ id: 'google', name: 'Google Workspace', vendor: 'Google', kind: 'identity', auth: 'oauth', description: 'Users, groups and organizational units from Google Workspace.', prd: 'M2', prdNote: 'Directory sync (FR-B3.3) is M2.' }),
  ];
}

const byTenant = reactive<Record<Id, Integration[]>>({});

export function integrationsFor(tenantId: Id): Integration[] {
  byTenant[tenantId] ??= catalog(tenantId);
  return byTenant[tenantId]!;
}

/** The one integration that owns this tenant's users and units, if any. */
export function activePeopleSource(tenantId: Id): Integration | undefined {
  return integrationsFor(tenantId).find((i) => i.kind === 'users' && i.status === 'connected');
}
