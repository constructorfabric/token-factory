# DESIGN

## Architecture

![Model Factory](img/model-factory.drawio.svg)

## Open questions

### p0 scope

To be discussed with @pr0tey, @artfizer, @MikeFalcon77, @nonameffd, @aviator5

1. [x] Who owns model deployment & status? Model deployer or model-registry? <<< scripts running by DevOps for now, data to be taken from graph storage

2. [x] Model names aliases (e.g. any GLM) - if GLM disappears, need to route GLM traffic somewhere. E.g. model upgrades <<< will be a part of the Design

3. [x] How to collect usage from model gateway? <<< use in-process usage collector

4. [x] Do we need to support Anthropic and OpenAI APIs in addition to Open Responses API? <<< yes, using pass-through API, it's a part of Design

7. [ ] Need to discuss what must be inside llm-gw-manager

8. [x] Review https://modelplane.ai/

9. [x] To check if we need quota resolver vs quota enforcer SDK <<< pr0tey to check if quota resolver API is enough. Seems like yes, then we don't need quota enforcer SDK

10. [x] How much quota to lease? <<< there could be per-model setting in model registry, which is set by Factory admin. Use micro-credits for that with fixed point, not float.

11. [x] Need to check requirements for model quota management (check if we need to use AI tokens vs AI credits in llm-gateway) <<< Use AI credits

12. [ ] Need to check with Mike/Oleg what is really needed from OAGW (credentials access, scaling, control plane vs data plane, OoP)

13. [ ] TO check if we need Model Factory backend at all. <<< Should we start with UI and see what it needs? 

To be discussed with @pr0tey, @artfizer, @MikeFalcon77, @nonameffd, @aviator5, @entropyshift, @diffora, @fluiderson 

14. [ ] How to integrate policy engine, admission control, approvals, licensing and quota management?

Auth topics:

1. [ ] should vLLM have authetication on front? <<< can't we use some proxy on top?

2. [ ] How to organize LLM tokens rate limits - inbound? Check how LiteLLM is doing that.

3. [ ] How to issue/revoke and authenticate/authorize LLM Gateway API clients?

4. [ ] Need a plugin (?) to support long-living model access key (token), maybe have some token broker 

Final design:

1. [ ] Need to review final requirements and update priorities
2. [ ] Need to draw sequence digrams for p0 scope, and define needed contracts
3. [ ] Create tasks for final p0 scope

### p1+ scope

1. [ ] Need to check how hw-usage-reporter can collect GPU usage from vLLM and who owns it?

2. [ ] Do we need temporal or it's enough to use task-engine?

3. [ ] To research NVidia 'switchyard' for routing https://github.com/NVIDIA-NeMo/Switchyard @pr0tey, @MikeFalcon77

4. [ ] Need to design BYOK

5. [ ] How to organize LLM tokens rate limits for outbound requests? Check how LiteLLM is doing that.

6. [ ] Should we have file downloader? or better introduce proxy for files access + files registry?

7. [ ] How to collect usage from model gateway with remote Usage Collector - use outbox or use sync API to usage collector? <<< need to register usage topic in usage-collector, and define base usage event schema