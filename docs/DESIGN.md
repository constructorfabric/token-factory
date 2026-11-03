# DESIGN

## Architecture

![Model Factory](img/model-factory.drawio.svg)

## Open questions

1. who owns model deployment & status? Model deployer or model-registry?
2. Model names aliases (e.g. any GLM) - if GLM disappears, need to route GLM traffic somewhere. E.g. model upgrades
3. should vLLM have authetication on front?
4. Should we have file downloader? or better introduce proxy for files access + files registry?
5. How to issue/revoke and authenticate/authorize LLM Gateway API clients?
6. How to organize LLM tokens rate limits - inbound / outbound? Check how LiteLLM is doing that.
7. How to collect usage from model gateway - use outbox or use sync API to usage collector?
8. Need to check how hw-usage-collector can collect GPU usage from vLLM and who owns it?
9. How to integrat policy engine, admission control, approvals and licensing?
10. Do we need to support Anthropic and OpenAI APIs in addition to Open Responses API?