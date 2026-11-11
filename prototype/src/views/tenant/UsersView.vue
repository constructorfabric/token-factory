<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UserTable from '@/components/tenant/UserTable.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { db } from '@/state/db';

const route = useRoute();
const tenantId = String(route.params.tenantId ?? 'root');
const users = computed(() => db.users.filter((u) => u.tenantId === tenantId));
</script>

<template>
  <div>
    <PageHeader title="Users" description="Everyone in the organization; a user's license is their unit's default unless set for them." />
    <UserTable :tenant-id="tenantId" :users="users" />
  </div>
</template>
