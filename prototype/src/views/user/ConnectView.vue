<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IconCopy } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { db, freshSecrets } from '@/state/db';
import { useMe } from './useMe';

const { notify } = useNotificationsStore();
const tool = ref<'claude' | 'codex'>('claude');
const route = useRoute();
const { user } = useMe();

// The key to set up with: the one just created (or picked from its menu), else the newest.
const keys = computed(() => db.apiKeys.filter((k) => k.userId === user.value?.id && k.status === 'active'));
const keyId = ref(String(route.query.key ?? keys.value[0]?.id ?? ''));
const key = computed(() => keys.value.find((k) => k.id === keyId.value));
// A secret is shown only once; the snippet carries it only right after creation.
const secret = computed(() => (key.value ? freshSecrets[key.value.id] : undefined));
const keyLine = computed(() => `export TF_API_KEY="${secret.value ?? `<paste your ${key.value?.prefix ?? 'cai-sk'}… key>`}"`);
const BASE = 'https://tf.constructor.tech';

// PRD FR-F2: Claude Code through the Anthropic-compatible endpoint, the main
// and the small/fast model mapped to families the user is allowed.
const snippets = {
  claude: {
    title: 'Claude Code',
    note: 'Step 1 points Claude Code at your models through the Anthropic-compatible endpoint. Step 2 installs the Token Factory MCP server, which also brings in the MCP servers your organization requires for you.',
    code: `# 0. Your key
KEYLINE

# 1. Models — main and background model mapped to scenario aliases
export ANTHROPIC_BASE_URL="${BASE}/anthropic"
export ANTHROPIC_AUTH_TOKEN="$TF_API_KEY"
export ANTHROPIC_MODEL="coding-default"
export ANTHROPIC_SMALL_FAST_MODEL="summarize-fast"

# 2. MCP — Token Factory and your organization's required servers
claude mcp add --transport http token-factory ${BASE}/mcp \\
  --header "Authorization: Bearer $TF_API_KEY"

claude`,
  },
  codex: {
    title: 'Codex CLI',
    note: 'Both steps go in ~/.codex/config.toml: the OpenAI-compatible endpoint as a custom provider, then the Token Factory MCP server.',
    code: `# 0. Your key — in your shell profile, not in this file
# KEYLINE

# 1. Models
[model_providers.tokenfactory]
name = "Token Factory"
base_url = "${BASE}/v1"
env_key = "TF_API_KEY"

[profiles.tf]
model_provider = "tokenfactory"
model = "coding-default"

# 2. MCP — Token Factory and your organization's required servers
[mcp_servers.token-factory]
url = "${BASE}/mcp"
bearer_token_env_var = "TF_API_KEY"`,
  },
};
const current = computed(() => ({ ...snippets[tool.value], code: snippets[tool.value].code.replace('KEYLINE', keyLine.value) }));

function copy(): void {
  void navigator.clipboard?.writeText(current.value.code);
  notify('Copied to the clipboard.', 'success');
}
</script>

<template>
  <div>
    <PageHeader title="Setup agent" description="Point your coding agent at Token Factory with one of your keys and limits apply wherever you call from. Other tools, SDKs and the API are in Documentation." />
    <div class="key-row">
      <GoFormControl label="API key">
        <GoSelect v-model="keyId" size="m" aria-label="API key" :disabled="!keys.length">
          <GoSelectOption v-for="k in keys" :key="k.id" :value="k.id">
            {{ k.name }}
            <template #description>{{ k.prefix }}…</template>
          </GoSelectOption>
        </GoSelect>
      </GoFormControl>
      <p v-if="!keys.length" class="hint">You have no active key. <RouterLink to="/me/keys" class="link">Create one</RouterLink> first.</p>
      <p v-else-if="secret" class="hint">Filled in below. Copy the snippet now; the key is not shown again.</p>
      <p v-else class="hint">Replace the placeholder with the key you saved. Lost it? <RouterLink to="/me/keys" class="link">Create a new key</RouterLink> and revoke the old one.</p>
    </div>
    <GoSegmentButtonGroup v-model="tool" size="s" aria-label="Tool" class="tabs">
      <GoSegmentButton value="claude">Claude Code</GoSegmentButton>
      <GoSegmentButton value="codex">Codex CLI</GoSegmentButton>
    </GoSegmentButtonGroup>
    <Card :title="current.title" :subtitle="current.note">
      <template #actions>
        <GoButton variant="secondary" size="s" @click="copy"><template #icon><IconCopy /></template>Copy</GoButton>
      </template>
      <pre class="code"><code>{{ current.code }}</code></pre>
    </Card>

  </div>
</template>

<style scoped>

  .key-row {
    display: grid;
    gap: var(--acv-spacing-xx-small, 4px);
    max-inline-size: 480px;
    margin-block-end: var(--acv-spacing-regular);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }

  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .endpoints {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .what {
    color: var(--acv-color-glyph-secondary);
  }

  .code {
    @mixin acv-text-ui-body-2;
    margin: 0;
    padding: var(--acv-spacing-regular);
    border-radius: var(--acv-radius-regular);
    background: var(--acv-color-surface-secondary);
    font-family: var(--acv-font-family-monospace, monospace);
    overflow-x: auto;
  }
</style>
