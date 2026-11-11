<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSecondaryNavigation, GoSecondaryNavigationItem, GoSecondaryNavigationSection } from '@constructor/ui/secondary-navigation';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { IconCircleExclamation, IconCode, IconCopy, IconPuzzle, IconRocket } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';

/**
 * How to reach Token Factory from anything other than the two agents on
 * Setup agent: other tools, SDKs, and the raw API. One section at a time,
 * through the kit's second-level navigation, like Settings.
 */
const route = useRoute();
const { notify } = useNotificationsStore();
const BASE = 'https://tf.constructor.tech';

const SECTIONS = [
  { title: 'Basics', items: [
    { id: 'start', label: 'Getting started', icon: IconRocket },
    { id: 'errors', label: 'Errors & limits', icon: IconCircleExclamation },
  ] },
  { title: 'Integrations', items: [
    { id: 'tf-sdk', label: 'Token Factory SDK', icon: IconCode },
    { id: 'tools', label: 'Other tools', icon: IconPuzzle },
    { id: 'sdks', label: 'Other SDKs', icon: IconCode },
  ] },
];
const section = computed(() => String(route.query.section ?? 'start'));

const ENDPOINTS = [
  { path: 'POST /v1/responses', what: 'Open Responses API — the native one' },
  { path: 'POST /v1/chat/completions', what: 'OpenAI-compatible chat, streamed over SSE' },
  { path: 'POST /v1/embeddings', what: 'Embeddings, for models that support them' },
  { path: 'GET /v1/models', what: 'Exactly the models your license allows' },
  { path: 'POST /anthropic/v1/messages', what: 'Anthropic-compatible messages' },
];

// Tools that accept a custom OpenAI- or Anthropic-compatible endpoint.
const TOOLS = [
  { name: 'Cline · Roo Code · Kilo Code', kind: 'VS Code agent', how: 'Provider “OpenAI Compatible”: base URL, key, model ID' },
  { name: 'Continue', kind: 'VS Code & JetBrains', how: 'config.yaml: provider openai, apiBase, apiKey, model' },
  { name: 'Aider', kind: 'Terminal agent', how: '--openai-api-base and --openai-api-key, model openai/<id>' },
  { name: 'OpenCode · Crush', kind: 'Terminal agent', how: 'Custom OpenAI-compatible provider in the config file' },
  { name: 'Qwen Code', kind: 'Terminal agent', how: 'OPENAI_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL — good with the Qwen family' },
  { name: 'Cursor', kind: 'IDE', how: 'Override OpenAI base URL; some features stay on Cursor’s own models' },
  { name: 'Zed', kind: 'Editor', how: 'Add an OpenAI-compatible provider in settings' },
  { name: 'Open WebUI · LibreChat · LobeChat', kind: 'Chat for everyone', how: 'Add an OpenAI-compatible connection' },
];

const SDKS = {
  python: {
    label: 'OpenAI Python',
    code: `from openai import OpenAI

client = OpenAI(base_url="${BASE}/v1", api_key=os.environ["TF_API_KEY"])
reply = client.chat.completions.create(
    model="GLM",  # a family alias, or a model ID from "My models"
    messages=[{"role": "user", "content": "Explain this stack trace"}],
)
print(reply.model, reply.choices[0].message.content)`,
  },
  js: {
    label: 'OpenAI JS',
    code: `import OpenAI from 'openai';

const client = new OpenAI({ baseURL: '${BASE}/v1', apiKey: process.env.TF_API_KEY });
const reply = await client.chat.completions.create({
  model: 'coding-default',
  messages: [{ role: 'user', content: 'Write a unit test for parseInvoice' }],
});`,
  },
  anthropic: {
    label: 'Anthropic',
    code: `import anthropic

client = anthropic.Anthropic(base_url="${BASE}/anthropic", api_key=os.environ["TF_API_KEY"])
msg = client.messages.create(model="coding-default", max_tokens=1024,
                             messages=[{"role": "user", "content": "Review this diff"}])`,
  },
  langchain: {
    label: 'LangChain',
    code: `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(base_url="${BASE}/v1", api_key=os.environ["TF_API_KEY"], model="GLM")
llm.invoke("Summarize this incident")`,
  },
  vercel: {
    label: 'Vercel AI SDK',
    code: `import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

const tf = createOpenAICompatible({ name: 'token-factory', baseURL: '${BASE}/v1', apiKey: process.env.TF_API_KEY });
const { text } = await generateText({ model: tf('GLM'), prompt: 'Draft release notes' });`,
  },
  curl: {
    label: 'curl',
    code: `curl ${BASE}/v1/chat/completions \\
  -H "Authorization: Bearer $TF_API_KEY" -H "Content-Type: application/json" \\
  -d '{"model": "GLM", "messages": [{"role": "user", "content": "Hello"}]}'`,
  },
} as const;
type SdkId = keyof typeof SDKS;

// Our own SDK: the OpenAI-compatible calls plus what only Token Factory knows —
// quotas and credits, aliases, usage and keys — typed, in each language.
const TF_SDK = {
  python: {
    label: 'Python',
    install: 'pip install token-factory',
    code: `from token_factory import TokenFactory

tf = TokenFactory()  # reads TF_API_KEY and TF_BASE_URL
reply = tf.chat("GLM", "Explain this stack trace")
print(reply.model, reply.text)

quota = tf.quota()          # credits left today / this week / this month
print(quota.daily.remaining, quota.daily.resets_at)
for row in tf.usage(period="30d", group_by="model"):
    print(row.model, row.credits)`,
  },
  typescript: {
    label: 'TypeScript',
    install: 'npm install @constructor/token-factory',
    code: `import { TokenFactory } from '@constructor/token-factory';

const tf = new TokenFactory(); // TF_API_KEY, TF_BASE_URL
const reply = await tf.chat('coding-default', 'Write a unit test for parseInvoice');

// Waits for the reset instead of failing when a quota is used up.
const tfPatient = new TokenFactory({ onQuotaExceeded: 'wait' });
const { daily } = await tf.quota();`,
  },
  go: {
    label: 'Go',
    install: 'go get github.com/constructorfabric/token-factory-go',
    code: `client := tokenfactory.NewClient() // TF_API_KEY, TF_BASE_URL
reply, err := client.Chat(ctx, "GLM", "Summarize this incident")
if errors.Is(err, tokenfactory.ErrQuotaExceeded) {
    // err carries the quota name and its reset time
}
quota, _ := client.Quota(ctx)
fmt.Println(reply.Model, quota.Daily.Remaining)`,
  },
  java: {
    label: 'Java',
    install: 'implementation("tech.constructor:token-factory:1.0.0")',
    code: `var tf = TokenFactory.fromEnv();
var reply = tf.chat("GLM", "Draft release notes");
var quota = tf.quota();
System.out.println(reply.model() + " " + quota.daily().remaining());`,
  },
  dotnet: {
    label: 'C# / .NET',
    install: 'dotnet add package Constructor.TokenFactory',
    code: `var tf = TokenFactoryClient.FromEnvironment();
var reply = await tf.ChatAsync("coding-default", "Review this diff");
var quota = await tf.GetQuotaAsync();
Console.WriteLine($"{reply.Model}: {quota.Daily.Remaining} credits left today");`,
  },
} as const;
type TfSdkId = keyof typeof TF_SDK;
const tfSdk = ref<TfSdkId>('python');
const sdk = ref<SdkId>('python');

const ERRORS = [
  { code: '401', type: 'authentication_error', when: 'Key missing, expired or revoked', retry: 'No — fix the key' },
  { code: '403', type: 'permission_error', when: 'The model is not in your license, or needs a premium grant', retry: 'No — request a license upgrade' },
  { code: '404', type: 'model_not_found', when: 'Unknown or retired model; the message names the alias to use', retry: 'No' },
  { code: '429', type: 'quota_exceeded', when: 'A quota is used up; the message names it and its reset time', retry: 'After the reset' },
  { code: '429', type: 'rate_limit_error', when: 'Too many requests per minute or in parallel', retry: 'Yes — after retry-after' },
  { code: '503', type: 'overloaded', when: 'The model is busy or restarting', retry: 'Yes — with backoff' },
];

function copy(text: string): void {
  void navigator.clipboard?.writeText(text);
  notify('Copied to the clipboard.', 'success');
}
</script>

<template>
  <div>
    <PageHeader title="Documentation" description="Use Token Factory from any tool or code that speaks the OpenAI or Anthropic API. Your key carries your license and limits wherever you call from." />

    <div class="docs-layout">
      <GoSecondaryNavigation aria-label="Documentation sections">
        <GoSecondaryNavigationSection v-for="g in SECTIONS" :key="g.title">
          <template #title>{{ g.title }}</template>
          <GoSecondaryNavigationItem v-for="item in g.items" :key="item.id" :component="'a'" :component-props="{ href: `#/me/docs?section=${item.id}` }" :active="section === item.id">
            <template #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </GoSecondaryNavigationItem>
        </GoSecondaryNavigationSection>
      </GoSecondaryNavigation>

      <div class="section">
        <template v-if="section === 'start'">
          <Card title="Getting started">
            <ol class="steps">
              <li>Create a key under <strong>API keys</strong>. It is shown once — keep it in an environment variable such as <code>TF_API_KEY</code>.</li>
              <li>Point your tool or code at <code>{{ BASE }}/v1</code> (OpenAI-compatible) or <code>{{ BASE }}/anthropic</code> (Anthropic-compatible).</li>
              <li>Ask for a model by ID or alias from <strong>My models</strong> — an alias such as <code>GLM</code> or <code>coding-default</code> keeps working when the model behind it is upgraded.</li>
            </ol>
          </Card>
          <Card title="Endpoints" subtitle="All behind one address; your key decides what answers" flush class="spaced">
            <GoTable size="sm">
              <GoTableRow v-for="e in ENDPOINTS" :key="e.path">
                <GoTableCell><code>{{ e.path }}</code></GoTableCell>
                <GoTableCell>{{ e.what }}</GoTableCell>
              </GoTableRow>
            </GoTable>
          </Card>
        </template>

        <Card v-else-if="section === 'tf-sdk'" title="Token Factory SDK" :subtitle="`${TF_SDK[tfSdk].label} — everything the OpenAI SDK does, plus quotas, credits, aliases, usage and keys`">
          <template #actions>
            <GoButton variant="secondary" size="s" @click="copy(TF_SDK[tfSdk].code)"><template #icon><IconCopy /></template>Copy</GoButton>
          </template>
          <GoSegmentButtonGroup v-model="tfSdk" size="s" aria-label="Language" class="sdk-tabs">
            <GoSegmentButton v-for="(v, id) in TF_SDK" :key="id" :value="id">{{ v.label }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <pre class="code code_install"><code>{{ TF_SDK[tfSdk].install }}</code></pre>
          <pre class="code"><code>{{ TF_SDK[tfSdk].code }}</code></pre>
          <ul class="features">
            <li><strong>Quota-aware:</strong> credits left and reset times; on <code>quota_exceeded</code>, fail with the quota named or wait for the reset.</li>
            <li><strong>Aliases first:</strong> ask for <code>GLM</code> or <code>coding-default</code>; the reply says which model answered.</li>
            <li><strong>Usage and keys:</strong> your usage by model, key and day; create and revoke your own keys.</li>
            <li><strong>Same wire format:</strong> streaming, tools and structured output exactly as the OpenAI API, so moving between SDKs costs nothing.</li>
          </ul>
        </Card>

        <Card v-else-if="section === 'tools'" title="Other tools" subtitle="Anything that takes a custom OpenAI-compatible endpoint works with your key" flush>
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell>Tool</GoTableCell>
              <GoTableCell>Kind</GoTableCell>
              <GoTableCell>How to point it at Token Factory</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="t in TOOLS" :key="t.name">
              <GoTableCell><strong>{{ t.name }}</strong></GoTableCell>
              <GoTableCell><GoTag size="s" color="neutral">{{ t.kind }}</GoTag></GoTableCell>
              <GoTableCell>{{ t.how }}</GoTableCell>
            </GoTableRow>
          </GoTable>
          <p class="note">Agents rely on the model's tool calls. Models marked for an agent in the catalog have passed the tool-calling benchmark for Claude Code and Codex; other pairings may work less well.</p>
        </Card>

        <Card v-else-if="section === 'sdks'" title="SDKs" :subtitle="`Same base URL and key in every language — ${SDKS[sdk].label}`">
          <template #actions>
            <GoButton variant="secondary" size="s" @click="copy(SDKS[sdk].code)"><template #icon><IconCopy /></template>Copy</GoButton>
          </template>
          <GoSegmentButtonGroup v-model="sdk" size="s" aria-label="SDK" class="sdk-tabs">
            <GoSegmentButton v-for="(v, id) in SDKS" :key="id" :value="id">{{ v.label }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <pre class="code"><code>{{ SDKS[sdk].code }}</code></pre>
          <p class="note">Also works with LlamaIndex, the LiteLLM SDK and any OpenAI-compatible client. The response names the model that actually answered.</p>
        </Card>

        <Card v-else title="Errors & limits" subtitle="What the gateway answers when it refuses, and whether to retry" flush>
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell>Code</GoTableCell>
              <GoTableCell>Type</GoTableCell>
              <GoTableCell>When</GoTableCell>
              <GoTableCell>Retry</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="e in ERRORS" :key="e.type">
              <GoTableCell>{{ e.code }}</GoTableCell>
              <GoTableCell><code>{{ e.type }}</code></GoTableCell>
              <GoTableCell>{{ e.when }}</GoTableCell>
              <GoTableCell>{{ e.retry }}</GoTableCell>
            </GoTableRow>
          </GoTable>
          <p class="note">Every response carries <code>x-tf-credits-remaining</code> and <code>x-tf-credits-reset</code>. Quotas reset at 00:00 UTC (day), Monday (week) and the 1st (month).</p>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .docs-layout {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: var(--acv-spacing-large);
    align-items: start;
  }

  .section {
    max-inline-size: 960px;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .steps {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding-inline-start: var(--acv-spacing-medium);
  }

  .sdk-tabs {
    margin-block-end: var(--acv-spacing-small);
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

  .code_install {
    margin-block-end: var(--acv-spacing-x-small);
  }

  .features {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: var(--acv-spacing-regular) 0 0;
    padding-inline-start: var(--acv-spacing-medium);
  }

  .note {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) var(--acv-spacing-medium) var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-secondary);
  }
</style>
