# DESIGN

## Architecture

![Model Factory](img/model-factory.drawio.svg)

## Open questions

### p0 scope

To be discussed with @pr0tey, @artfizer, @MikeFalcon77, @nonameffd, @aviator5

1. [ ] Who owns model deployment & status? Model deployer or model-registry?
2. [ ] Model names aliases (e.g. any GLM) - if GLM disappears, need to route GLM traffic somewhere. E.g. model upgrades
3. [ ] should vLLM have authetication on front?
4. [ ] Should we have file downloader? or better introduce proxy for files access + files registry?
5. [ ] How to issue/revoke and authenticate/authorize LLM Gateway API clients?
6. [ ] How to organize LLM tokens rate limits - inbound / outbound? Check how LiteLLM is doing that.
7. [ ] How to collect usage from model gateway - use outbox or use sync API to usage collector?
8. [ ] Do we need to support Anthropic and OpenAI APIs in addition to Open Responses API?
9. [ ] Need to discuss what must be inside llm-gw-manager
10. [ ] Need to design BYOK
11. [x] Review https://modelplane.ai/
12. [ ] To check if we need quota resolver vs quota enforcer SDK
13. [ ] Need to check requirements for model quota management (check if we need to use AI tokens vs AI credits in llm-gateway)
14. [ ] Need a plugin (?) to support long-living model access key (token), maybe have some token broker 
15. [ ] Need to check with Mike/Oleg what is really needed from OAGW
16. [ ] Do we need temporal or it's enough to use task-engine?
17. [ ] To research NVidia 'switchyard' for routing https://github.com/NVIDIA-NeMo/Switchyard @pr0tey, @MikeFalcon77

To be discussed with @pr0tey, @artfizer, @MikeFalcon77, @nonameffd, @aviator5, @entropyshift, @diffora, @fluiderson 

18. [ ] How to integrate policy engine, admission control, approvals and licensing?

Final design:

1. [ ] Need to review final requirements and update priorities
2. [ ] Need to draw sequence digrams for p0 scope, and define needed contracts
3. [ ] Create tasks for final p0 scope

### p1+ scope

1. [ ] Need to check how hw-usage-reporter can collect GPU usage from vLLM and who owns it?