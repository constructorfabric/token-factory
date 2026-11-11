import {
  IconPlay,
  IconAi,
  IconBook,
  IconChartBar,
  IconChartLine,
  IconCircleCheck,
  IconClockArrowRotateLeft,
  IconCube,
  IconDashboardNewui,
  IconGpu,
  IconHomeNewui,
  IconKey,
  IconLayers,
  IconOrganization,
  IconPlugConnection,
  IconPulse,
  IconReceipt,
  IconRobot,
  IconRocket,
  IconSettings2Newui,
  IconShieldCheck,
  IconSpeed,
  IconTerminal,
  IconUsersNewui,
} from '@/components/icons';
import type { Component } from 'vue';
import type { ContextKind } from '@/state/session';

export interface NavItem {
  name: string;
  label: string;
  icon: Component;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/** Every role is also a user: its own usage, keys, models and tools. */
const PERSONAL: NavSection = {
  title: 'Personal',
  items: [
    { name: 'user-home', label: 'My usage', icon: IconHomeNewui },
    { name: 'user-keys', label: 'API keys', icon: IconKey },
    { name: 'user-models', label: 'My models', icon: IconRobot },
    { name: 'user-tools', label: 'MCP servers', icon: IconTerminal },
    { name: 'user-connect', label: 'Setup agent', icon: IconPlugConnection },
    { name: 'user-docs', label: 'Documentation', icon: IconBook },
  ],
};

export const NAV: Record<ContextKind, NavSection[]> = {
  root: [
    { items: [
      { name: 'root-overview', label: 'Overview', icon: IconDashboardNewui },
      { name: 'root-tenants', label: 'Tenants', icon: IconOrganization },
    ] },
    { title: 'Models', items: [
      { name: 'root-models', label: 'Model catalog', icon: IconAi },
      { name: 'root-lifecycle', label: 'Lifecycle', icon: IconRocket },
      { name: 'root-benchmarks', label: 'Benchmarks', icon: IconSpeed },
      { name: 'root-routing', label: 'Aliases & routing', icon: IconLayers },
      { name: 'root-guardrails', label: 'Guardrails', icon: IconShieldCheck },
      { name: 'root-registry', label: 'Tools & skills', icon: IconTerminal },
    ] },
    { title: 'Infrastructure', items: [
      { name: 'root-providers', label: 'Providers', icon: IconPlugConnection },
      { name: 'root-deployments', label: 'Deployments', icon: IconGpu },
      { name: 'root-evaluation', label: 'Evaluation', icon: IconPlay },
      { name: 'root-monitoring', label: 'Monitoring', icon: IconPulse },
    ] },
    { title: 'Governance', items: [
      { name: 'root-usage', label: 'Usage', icon: IconChartLine },
      { name: 'root-audit', label: 'Audit log', icon: IconClockArrowRotateLeft },
      { name: 'root-settings', label: 'Settings', icon: IconSettings2Newui },
    ] },
    { title: 'Organization', items: [
      { name: 'root-org', label: 'Departments', icon: IconOrganization },
      { name: 'root-users', label: 'Users', icon: IconUsersNewui },
      { name: 'root-licenses', label: 'Licenses', icon: IconReceipt },
      { name: 'root-approvals', label: 'License requests', icon: IconCircleCheck },
    ] },
    PERSONAL,
  ],
  tenant: [
    { items: [
      { name: 'tenant-overview', label: 'Overview', icon: IconDashboardNewui },
    ] },
    { title: 'Organization', items: [
      { name: 'tenant-org', label: 'Departments', icon: IconOrganization },
      { name: 'tenant-users', label: 'Users', icon: IconUsersNewui },
      { name: 'tenant-licenses', label: 'Licenses', icon: IconReceipt },
      { name: 'tenant-approvals', label: 'License requests', icon: IconCircleCheck },
    ] },
    { title: 'Models', items: [
      { name: 'tenant-models', label: 'Models', icon: IconCube },
      { name: 'tenant-keys', label: 'Provider keys (BYOK)', icon: IconKey },
      { name: 'tenant-guardrails', label: 'Guardrails', icon: IconShieldCheck },
      { name: 'tenant-tools', label: 'Tools & skills', icon: IconTerminal },
    ] },
    { title: 'Governance', items: [
      { name: 'tenant-reports', label: 'Reports', icon: IconChartBar },
      { name: 'tenant-audit', label: 'Audit log', icon: IconClockArrowRotateLeft },
      { name: 'tenant-settings', label: 'Settings', icon: IconSettings2Newui },
    ] },
    PERSONAL,
  ],
  user: [
    { items: [
      { name: 'user-home', label: 'My usage', icon: IconHomeNewui },
      { name: 'user-keys', label: 'API keys', icon: IconKey },
      { name: 'user-models', label: 'My models', icon: IconRobot },
      { name: 'user-tools', label: 'MCP servers', icon: IconTerminal },
      { name: 'user-connect', label: 'Setup agent', icon: IconPlugConnection },
      { name: 'user-docs', label: 'Documentation', icon: IconBook },
    ] },
  ],
};
