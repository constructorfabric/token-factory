import { computed, reactive, watch } from 'vue';
import { DEMO_TENANT_ID, ROOT_TENANT_ID } from '@/data/mock';
import type { Id } from '@/data/types';

/**
 * Who is signed in, and who they are acting as.
 *
 * Impersonation is a stack, not a switch: the root administrator steps into a
 * tenant as a service engineer, and from there into one of its users. Each
 * step is shown and can be left on its own, and the user at the bottom of
 * the stack is always the one recorded in the audit log.
 */
export type ContextKind = 'root' | 'tenant' | 'user';

export interface SessionContext {
  kind: ContextKind;
  tenantId: Id;
  /** The user acting at this level. */
  person: string;
  role: string;
  userId?: Id;
  reason?: string;
  startedAt: string;
}

interface SessionState {
  signedIn: boolean;
  stack: SessionContext[];
}

const STORAGE_KEY = 'hybrid-ai-demo-session';

function load(): SessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SessionState;
  } catch {
    // A private window or blocked storage starts signed out, which is fine.
  }
  return { signedIn: false, stack: [] };
}

const state = reactive<SessionState>(load());

watch(
  state,
  (value) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Not persisting across reloads is acceptable in a demo.
    }
  },
  { deep: true },
);

export const ROOT_ADMIN = { person: 'Victor Batraev', role: 'Instance Admin', email: 'victor.batraev@constructor.tech' };

export function signIn(): void {
  state.signedIn = true;
  state.stack = [
    { kind: 'root', tenantId: ROOT_TENANT_ID, person: ROOT_ADMIN.person, role: ROOT_ADMIN.role, startedAt: new Date().toISOString() },
  ];
}

export function signOut(): void {
  state.signedIn = false;
  state.stack = [];
}

export function enterTenant(tenantId: Id, reason: string): void {
  state.stack = [
    state.stack[0]!,
    { kind: 'tenant', tenantId, person: ROOT_ADMIN.person, role: 'Service Engineer', reason, startedAt: new Date().toISOString() },
  ];
}

export function enterUser(tenantId: Id, userId: Id, person: string, reason: string): void {
  const tenantLevel = state.stack.find((c) => c.kind === 'tenant');
  state.stack = [
    state.stack[0]!,
    ...(tenantLevel ? [tenantLevel] : []),
    { kind: 'user', tenantId, userId, person, role: 'User', reason, startedAt: new Date().toISOString() },
  ];
}

/** Leave every level above `kind`, returning to it. */
export function exitTo(kind: ContextKind): void {
  const index = state.stack.findIndex((c) => c.kind === kind);
  if (index >= 0) state.stack = state.stack.slice(0, index + 1);
}

export const session = {
  signedIn: computed(() => state.signedIn),
  stack: computed(() => state.stack),
  current: computed(() => state.stack[state.stack.length - 1]),
  impersonating: computed(() => state.stack.length > 1),
};

export const DEFAULT_DEMO_TENANT = DEMO_TENANT_ID;
