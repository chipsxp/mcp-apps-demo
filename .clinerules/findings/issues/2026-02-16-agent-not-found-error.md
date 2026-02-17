# Issue: Agent 'default' Not Found Error

**Date:** 2026-02-16
**Status:** RESOLVED
**Severity:** High - Blocking functionality

## Symptom

When loading the application, the following error appeared:

```
POST /api/copilotkit/agent/default/connect 404
useAgent: Agent 'default' not found after runtime sync (runtimeUrl=/api/copilotkit). No agents registered.
```

## Root Cause

The API route was using the old CopilotKit runtime pattern which doesn't register agents properly with the new `@copilotkitnext/*` packages. The agent needs to be explicitly registered with the runtime.

## Affected Files

- `src/app/api/copilotkit/[[...slug]]/route.ts`

## Impact

The chat sidebar would not initialize properly, and no AI interactions were possible.

## Resolution

Updated the API route to use the new CopilotKitNext pattern with:

1. `BuiltInAgent` from `@copilotkitnext/agent`
2. `CopilotRuntime` with explicit `agents` configuration
3. `InMemoryAgentRunner` for agent execution
4. `createCopilotEndpoint` with Hono handler

```typescript
const agent = new BuiltInAgent({
  model: "openai/gpt-4o",
  prompt: "...",
}).use(new MCPAppsMiddleware({ mcpServers: [...] }));

const runtime = new CopilotRuntime({
  agents: { default: agent },  // Explicit agent registration
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({ runtime, basePath: "/api/copilotkit" });
export const GET = handle(app);
export const POST = handle(app);
```

## Related Files

- Solution: `2026-02-16-copilotkit-next-migration.md`
