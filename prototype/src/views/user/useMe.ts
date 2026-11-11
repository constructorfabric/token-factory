import { computed } from 'vue';
import { db, effectiveUserLicense, unitById } from '@/state/db';
import { session } from '@/state/session';

/** Whose personal pages these are: the impersonated user, or the user acting. */
export const OWN_USER_ID = 'u-victor';

export function useMe() {
  const user = computed(() => db.users.find((u) => u.id === (session.current.value?.kind === 'user' ? session.current.value.userId : OWN_USER_ID)));
  const seat = computed(() => (user.value ? effectiveUserLicense(user.value) : { license: undefined, source: 'unit' as const }));
  const unit = computed(() => unitById(user.value?.unitId));
  return { user, seat, unit };
}
