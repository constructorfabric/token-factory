import type { Capability, Modality, Model, ModelMode } from '@/data/types';

/**
 * What a model can do, as callers depend on it. The fields follow the two
 * catalogs gateways use: LiteLLM's model map (mode, max input and output
 * tokens, supports_* flags) and OpenRouter's (input and output modalities,
 * supported request parameters). A scenario alias requires some of these, so
 * every model it can route to must have them; a model alias should not lose
 * one when it moves to a newer version.
 */
export const CAPABILITIES: { id: Capability; label: string; hint: string; group: 'Tools' | 'Output' | 'Context' | 'Prompting' }[] = [
  { id: 'tools', label: 'Tool calling', hint: 'Function calls; agents such as Claude Code and Codex need it', group: 'Tools' },
  { id: 'tool-choice', label: 'Forced tool choice', hint: 'The caller can require a particular tool (tool_choice)', group: 'Tools' },
  { id: 'parallel-tools', label: 'Parallel tool calls', hint: 'Several tool calls in one turn', group: 'Tools' },
  { id: 'computer-use', label: 'Computer use', hint: 'Screen, mouse and keyboard tools', group: 'Tools' },
  { id: 'web-search', label: 'Web search', hint: 'Provider-side search tool; only through that provider', group: 'Tools' },
  { id: 'json', label: 'Structured output', hint: 'Answers that follow a JSON schema (response_format)', group: 'Output' },
  { id: 'reasoning', label: 'Extended reasoning', hint: 'Thinks before answering; effort can be set', group: 'Output' },
  { id: 'code', label: 'Code', hint: 'Tuned and benchmarked for code', group: 'Output' },
  { id: 'vision', label: 'Images in', hint: 'Screenshots, diagrams and scans in the prompt', group: 'Context' },
  { id: 'long-context', label: 'Long context', hint: '500K tokens or more', group: 'Context' },
  { id: 'prompt-caching', label: 'Prompt caching', hint: 'Repeated prompt prefixes billed at the cache price', group: 'Context' },
  { id: 'system-messages', label: 'System messages', hint: 'Takes a system prompt; when not, the gateway folds it into the first message', group: 'Prompting' },
  { id: 'assistant-prefill', label: 'Assistant prefill', hint: 'The caller can start the answer for the model', group: 'Prompting' },
];
export const CAP_GROUPS = ['Tools', 'Output', 'Context', 'Prompting'] as const;
export const capLabel = (c: Capability) => CAPABILITIES.find((x) => x.id === c)?.label ?? c;
/** Which of the required capabilities a model lacks. */
export const missingCaps = (m: Model | undefined, required: Capability[] = []) => (m ? required.filter((c) => !m.capabilities.includes(c)) : required);

export const MODES: { id: ModelMode; label: string }[] = [
  { id: 'chat', label: 'Chat and completion' },
  { id: 'embedding', label: 'Embeddings' },
  { id: 'rerank', label: 'Rerank' },
  { id: 'image', label: 'Image generation' },
  { id: 'transcription', label: 'Speech to text' },
  { id: 'speech', label: 'Text to speech' },
  { id: 'moderation', label: 'Moderation' },
];
export const MODALITIES: { id: Modality; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Images' },
  { id: 'file', label: 'Files (PDF)' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
];
/** Request parameters, in OpenRouter's names; the gateway maps them to each provider's. */
export const PARAMS = ['max_tokens', 'temperature', 'top_p', 'top_k', 'stop', 'seed', 'response_format', 'tools', 'tool_choice', 'parallel_tool_calls', 'reasoning_effort', 'logprobs', 'frequency_penalty', 'presence_penalty', 'web_search_options'] as const;

/** The model's full profile: what it set, else what its provider usually offers. */
export function profileOf(m: Model) {
  const anthropic = /anthropic/i.test(m.provider) || m.family === 'Claude';
  const google = /google|vertex/i.test(m.provider) || m.family === 'Gemini';
  const openai = /openai|azure/i.test(m.provider) || m.family === 'GPT';
  const input: Modality[] = m.inputModalities ?? ['text', ...(m.capabilities.includes('vision') ? (['image'] as Modality[]) : []), ...(anthropic || google || openai ? (['file'] as Modality[]) : []), ...(google ? (['audio', 'video'] as Modality[]) : [])];
  const has = (c: Capability) => m.capabilities.includes(c);
  const params = m.params ?? [
    'max_tokens', 'temperature', 'top_p', 'stop',
    ...(anthropic || google ? ['top_k'] : []),
    ...(!anthropic ? ['seed', 'frequency_penalty', 'presence_penalty'] : []),
    ...(has('json') ? ['response_format'] : []),
    ...(has('tools') ? ['tools', 'tool_choice'] : []),
    ...(has('tools') && !anthropic ? ['parallel_tool_calls'] : []),
    ...(has('reasoning') ? ['reasoning_effort'] : []),
    ...(openai ? ['logprobs'] : []),
    ...(has('web-search') ? ['web_search_options'] : []),
  ];
  return {
    mode: m.mode ?? ('chat' as ModelMode),
    input,
    output: m.outputModalities ?? (['text'] as Modality[]),
    maxOutput: m.maxOutput ?? (anthropic ? 64_000 : openai ? 128_000 : google ? 65_536 : 16_384),
    params,
    unsupported: m.unsupportedParams ?? ('drop' as const),
  };
}
