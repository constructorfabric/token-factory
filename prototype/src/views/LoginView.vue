<script setup lang="ts">
import logoUrl from '@constructor/globals/themes/constructor/icons/logo-full.svg';
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconLock } from '@/components/icons';
import { ROOT_ADMIN, signIn } from '@/state/session';

/** Corporate SSO on the root tenant. The password is not checked: it is a demo. */
const router = useRouter();
const email = ref(ROOT_ADMIN.email);

function login(): void {
  signIn();
  void router.push('/root/overview');
}
</script>

<template>
  <div class="login-view">
    <form class="panel" @submit.prevent="login">
      <img :src="logoUrl" alt="Constructor" class="logo" />
      <h1 class="title">Sign in to Token Factory</h1>
      <p class="subtitle">Instance “Constructor Fabric TF” · Instance Admin sign-in</p>
      <GoFormControl label="Work email" label-for="login-email">
        <GoInput id="login-email" v-model="email" size="l" />
      </GoFormControl>
      <GoButton type="submit" size="l" class="submit">
        <template #icon><IconLock /></template>
        Continue with Constructor Fabric Pass
      </GoButton>
      <p class="note">Signed in as {{ ROOT_ADMIN.person }}, {{ ROOT_ADMIN.role }}. MFA is enforced for the root tenant.</p>
    </form>
  </div>
</template>

<style scoped>
  .login-view {
    display: grid;
    place-items: center;
    block-size: 100%;
    background: var(--acv-color-surface-secondary);
  }

  .panel {
    display: grid;
    gap: var(--acv-spacing-regular);
    inline-size: 400px;
    padding: var(--acv-spacing-x-large);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-x-large);
    background: var(--acv-color-surface-primary);
    box-shadow: var(--acv-shadow-surface);
  }

  .logo {
    block-size: 28px;
    justify-self: start;
  }

  .title {
    @mixin acv-text-heading-4;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .subtitle {
    @mixin acv-text-ui-body-2;
    margin: calc(var(--acv-spacing-small) * -1) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .submit {
    inline-size: 100%;
  }

  .note {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
