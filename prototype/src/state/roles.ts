import type { Tenant, TenantRole, User } from '@/data/types';
import { licenseOfTenant } from '@/state/tenantLicenses';

/**
 * Roles an organization hands its users, on top of being a user. Everyone is
 * a user; a role adds what they may manage. Assigned on the user's page.
 */
/** Where a role can be given: every tenant, or the root tenant only. */
export type RoleScope = 'tenant' | 'instance';
export const ROLES: { id: TenantRole; label: string; description: string; scope: RoleScope }[] = [
  { id: 'tenant-admin', label: 'Customer admin', description: 'Everything in this organization: users, licenses, models, keys, settings; impersonate its users; create tenants beneath it when licensed.', scope: 'tenant' },
  { id: 'user-manager', label: 'User manager', description: 'Users and units: invite, disable, assign licenses and roles below admin.', scope: 'tenant' },
  { id: 'license-manager', label: 'License manager', description: 'Create and edit licenses and set unit defaults.', scope: 'tenant' },
  { id: 'reports-viewer', label: 'Reports viewer', description: 'Read reports and the audit log; changes nothing.', scope: 'tenant' },
  { id: 'support-engineer', label: 'Support engineer', description: 'Enter a tenant read-only to help, within its support access rules.', scope: 'instance' },
  { id: 'service-engineer', label: 'Service engineer', description: 'Enter a tenant with full access to fix things, within its support access rules.', scope: 'instance' },
];

/** Everyone holds this one; it cannot be removed. */
export const USER_ROLE = { label: 'User', description: 'Uses models within their license; manages their own API keys.' };

export const roleLabel = (r: TenantRole) => ROLES.find((x) => x.id === r)?.label ?? r;

/** A user's roles; older records carry only the admin flag. */
export const rolesOf = (u: User): TenantRole[] => u.roles ?? (u.role === 'tenant-admin' ? ['tenant-admin'] : []);

/** The roles a user of this tenant can be given. */
export function rolesFor(tenant?: Tenant): typeof ROLES {
  return ROLES.filter((r) => r.scope === 'tenant' || (r.scope === 'instance' && tenant?.tier === 'root'));
}

/** The root can; any other tenant when its tenant license allows it. */
export const canCreateTenants = (tenant?: Tenant) => !!tenant && (tenant.tier === 'root' || !!licenseOfTenant(tenant)?.createTenants);
