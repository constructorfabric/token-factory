import type { Assignment, McpServer, Skill, SkillSet } from './types';

// Phase 2 stories: MCP registry (MCP-01..10), skill sets (SKL-07..11) and
// organizational assignment (ORG-01..12). Invented for the demo.

export const mcpServers: McpServer[] = [
  // Token Factory's own server: the agent can see the user's models, quota and usage, and manage their keys.
  { id: 'mcp-tf', name: 'Token Factory', publisher: 'Constructor', source: 'internal', version: '1.0.0', transport: 'http', credentials: 'per-user-oauth', state: 'ga', risk: 'low', scan: 'Platform component · uses your own Token Factory key',
    tools: [{ name: 'list_models', risk: 'read' }, { name: 'get_quota', risk: 'read' }, { name: 'get_usage', risk: 'read' }, { name: 'list_api_keys', risk: 'read' }, { name: 'create_api_key', risk: 'write' }, { name: 'request_license_upgrade', risk: 'write' }] },
  { id: 'mcp-github', name: 'GitHub', publisher: 'GitHub', source: 'official-registry', version: '1.4.2', transport: 'http', credentials: 'per-user-oauth', state: 'ga', risk: 'medium', scan: 'No known vulnerabilities · signed release · egress api.github.com only',
    tools: [{ name: 'search_code', risk: 'read' }, { name: 'get_pull_request', risk: 'read' }, { name: 'create_pull_request', risk: 'write' }, { name: 'merge_pull_request', risk: 'admin' }] },
  { id: 'mcp-gitlab', name: 'GitLab (company)', publisher: 'Acme Platform team', source: 'internal', version: '0.9.0', transport: 'http', credentials: 'per-user-oauth', state: 'ga', risk: 'medium', scan: 'Internal build · dependency scan clean',
    tools: [{ name: 'get_merge_request', risk: 'read' }, { name: 'list_pipelines', risk: 'read' }, { name: 'comment_on_merge_request', risk: 'write' }] },
  { id: 'mcp-youtrack', name: 'YouTrack', publisher: 'JetBrains', source: 'vendor', version: '2.1.0', transport: 'http', credentials: 'shared', state: 'ga', risk: 'low', scan: 'No known vulnerabilities',
    tools: [{ name: 'search_issues', risk: 'read' }, { name: 'create_issue', risk: 'write' }] },
  { id: 'mcp-pagerduty', name: 'PagerDuty', publisher: 'PagerDuty', source: 'official-registry', version: '0.6.1', transport: 'http', credentials: 'shared', state: 'approved', risk: 'medium', scan: 'Tool list changed since 0.5: added resolve_incident',
    tools: [{ name: 'list_incidents', risk: 'read' }, { name: 'acknowledge_incident', risk: 'write' }, { name: 'resolve_incident', risk: 'write' }] },
  { id: 'mcp-postgres', name: 'PostgreSQL', publisher: 'Community', source: 'official-registry', version: '0.3.4', transport: 'stdio', credentials: 'shared', state: 'verified', risk: 'high', scan: 'Executes arbitrary SQL · local process · tool descriptions clean',
    tools: [{ name: 'query', risk: 'read' }, { name: 'execute', risk: 'admin' }] },
  { id: 'mcp-confluence', name: 'Confluence', publisher: 'Atlassian', source: 'vendor', version: '1.1.0', transport: 'http', credentials: 'per-user-oauth', state: 'ga', risk: 'low', scan: 'No known vulnerabilities',
    tools: [{ name: 'search_pages', risk: 'read' }, { name: 'get_page', risk: 'read' }] },
  { id: 'mcp-webfetch', name: 'Fetch (web)', publisher: 'Community', source: 'official-registry', version: '2.0.0', transport: 'stdio', credentials: 'none', state: 'failed', risk: 'high', scan: 'Tool description contains instructions aimed at the model (tool poisoning)',
    tools: [{ name: 'fetch', risk: 'read' }] },
];

export const skills: Skill[] = [
  { id: 'sk-review', name: 'Code review', description: 'Reviews a merge request against the team checklist', version: '3.2', requiresMcp: ['mcp-gitlab'] },
  { id: 'sk-tests', name: 'Write tests', description: 'Adds unit tests for changed code', version: '2.0', requiresMcp: [] },
  { id: 'sk-release', name: 'Release notes', description: 'Drafts release notes from merged work', version: '1.4', requiresMcp: ['mcp-gitlab', 'mcp-youtrack'] },
  { id: 'sk-incident', name: 'Incident triage', description: 'Summarizes an incident and proposes next steps', version: '1.1', requiresMcp: ['mcp-pagerduty'] },
  { id: 'sk-postmortem', name: 'Postmortem', description: 'Drafts a blameless postmortem', version: '1.0', requiresMcp: ['mcp-pagerduty', 'mcp-confluence'] },
  { id: 'sk-story', name: 'User story', description: 'Writes stories with acceptance criteria', version: '2.3', requiresMcp: ['mcp-youtrack'] },
  { id: 'sk-prd', name: 'PRD section', description: 'Drafts a PRD section from notes', version: '1.2', requiresMcp: ['mcp-confluence'] },
  { id: 'sk-sql', name: 'SQL analyst', description: 'Answers questions from the warehouse', version: '0.8', requiresMcp: ['mcp-postgres'] },
];

export const skillSets: SkillSet[] = [
  { id: 'ss-eng', name: 'Engineering basics', description: 'What every engineer gets: tests and review.', owner: 'Platform Engineering', version: '4.1', skills: ['sk-review', 'sk-tests'], state: 'ga', testsPassed: 48, testsTotal: 48, conflicts: 0, users: 520 },
  { id: 'ss-backend', name: 'Backend development', description: 'Review, tests and release notes for service teams.', owner: 'Platform Engineering', version: '2.6', skills: ['sk-review', 'sk-tests', 'sk-release'], state: 'rolling-out', ring: 'pilot', testsPassed: 71, testsTotal: 72, conflicts: 0, users: 183 },
  { id: 'ss-incident', name: 'Incident response', description: 'Triage and postmortems for on-call engineers.', owner: 'SRE', version: '1.3', skills: ['sk-incident', 'sk-postmortem'], state: 'approved', testsPassed: 30, testsTotal: 30, conflicts: 0, users: 48 },
  { id: 'ss-pm', name: 'Product management', description: 'Stories and PRD sections.', owner: 'Product Ops', version: '1.8', skills: ['sk-story', 'sk-prd'], state: 'ga', testsPassed: 26, testsTotal: 27, conflicts: 1, users: 84 },
  { id: 'ss-data', name: 'Data analysis', description: 'SQL answers from the warehouse.', owner: 'Data Platform', version: '0.8', skills: ['sk-sql'], state: 'verifying', testsPassed: 9, testsTotal: 14, conflicts: 0, users: 0 },
];

export const assignments: Assignment[] = [
  { id: 'as0', tenantId: 'root', unitId: null, kind: 'skillset', itemId: 'ss-eng', level: 'required', setBy: 'Victor Batraev' },
  { id: 'as0b', tenantId: 'root', unitId: null, kind: 'skillset', itemId: 'ss-incident', level: 'recommended', setBy: 'Victor Batraev' },
  { id: 'as1', tenantId: 't-acme', unitId: null, kind: 'mcp', itemId: 'mcp-confluence', level: 'available', setBy: 'Daniel Novak' },
  { id: 'as2', tenantId: 't-acme', unitId: null, kind: 'mcp', itemId: 'mcp-postgres', level: 'blocked', setBy: 'Daniel Novak' },
  { id: 'as3', tenantId: 't-acme', unitId: 'un-eng', kind: 'skillset', itemId: 'ss-eng', level: 'required', setBy: 'Daniel Novak' },
  { id: 'as4', tenantId: 't-acme', unitId: 'un-eng', kind: 'skillset', itemId: 'ss-backend', level: 'recommended', setBy: 'Linus Berg' },
  { id: 'as5', tenantId: 't-acme', unitId: 'un-payments', kind: 'skillset', itemId: 'ss-incident', level: 'recommended', setBy: 'Margaret Hamilton' },
  { id: 'as6', tenantId: 't-acme', unitId: 'un-product', kind: 'skillset', itemId: 'ss-pm', level: 'required', setBy: 'Daniel Novak' },
  { id: 'as7', tenantId: 't-acme', unitId: 'un-data', kind: 'skillset', itemId: 'ss-data', level: 'available', setBy: 'Frances Allen' },
];
