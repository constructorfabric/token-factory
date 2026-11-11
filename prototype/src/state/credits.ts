import type { Id } from '@/data/types';
import { ROOT_TENANT_ID } from '@/data/mock';
import { tenantById, type CreditSource } from '@/state/db';
import { session } from '@/state/session';

/**
 * The second credit budget is named after the company that pays for it:
 * "Acme-own credits" for Acme Corp. At root, which spans every company, it is
 * "Tenant-own credits". Reactive: it follows the tenant of the current session.
 */
export function companyShort(tenantId?: Id): string {
  const id = tenantId ?? session.current.value?.tenantId;
  const name = id && id !== ROOT_TENANT_ID ? tenantById(id)?.name : undefined;
  return name ? name.split(/\s+/)[0]! : 'Tenant';
}

/** "Acme-own", for tags and short mentions. */
export const ownName = (tenantId?: Id) => `${companyShort(tenantId)}-own`;
/** "Acme-own credits". */
export const ownCredits = (tenantId?: Id) => `${ownName(tenantId)} credits`;

export const sourceLabel = (s: CreditSource, tenantId?: Id) => (s === 'keys' ? ownCredits(tenantId) : 'Platform credits');
