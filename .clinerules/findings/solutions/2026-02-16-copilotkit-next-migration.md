# Solution: CopilotKit Next Migration

**Date:** 2026-02-16
**Related Issue:** 2026-02-16-copilotkit-api-deprecation.md
**Related Debug:** 2026-02-16-copilotkit-api-investigation.md

## Problem Summary

The old `@copilotkit/react-core` API with `TextMessage` and `MessageRole` was deprecated and caused TypeScript compilation errors.

## Solution Chosen

Migrated to the new `@copilotkitnext/*` packages following the official mcp-apps-demo repository pattern.

## Changes Made

### 1. Package Updates (`package.json`)

**Removed:**

- `@copilotkit/react-core`
- `@copilotkit/react-ui`
- `@copilotkit/runtime`

**Added:**

- `@copilotkitnext/react`: `1.51.0-next.4`
- `@copilotkitnext/runtime`: `1.51.0-next.4`
- `@copilotkitnext/agent`: `1.51.0-next.4`
- `@copilotkitnext/core`: `1.51.0-next.4`
- `@copilotkitnext/shared`: `1.51.0-next.4`
- `@ag-ui/client`: `^0.0.42`
- `@ag-ui/encoder`: `^0.0.42`
- `@ag-ui/mcp-apps-middleware`: `^0.0.1`
- `hono`: `^4.11.3`

### 2. Page Component (`src/app/page.tsx`)

**Before:**

```typescript
import { CopilotKit, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";

const { appendMessage } = useCopilotChat();
await appendMessage(
  new TextMessage({ role: MessageRole.User, content: message }),
);
```

**After:**

```typescript
import {
  CopilotKitProvider,
  CopilotSidebar,
  useAgent,
  useCopilotKit,
  useCopilotChatConfiguration,
} from "@copilotkitnext/react";
import { randomUUID, DEFAULT_AGENT_ID } from "@copilotkitnext/shared";

const { agent } = useAgent({ agentId: DEFAULT_AGENT_ID });
const { copilotkit } = useCopilotKit();
const config = useCopilotChatConfiguration();

const sendMessage = async (message: string) => {
  config?.setModalOpen(true);
  agent.addMessage({
    id: randomUUID(),
    role: "user",
    content: message,
  });
  await copilotkit.runAgent({ agent });
};
```

### 3. API Route (`src/app/api/copilotkit/[[...slug]]/route.ts`)

**Before:**

```typescript
import { CopilotRuntime } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
```

**After:**

```typescript
import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import { BuiltInAgent } from "@copilotkitnext/agent";
import { MCPAppsMiddleware } from "@ag-ui/mcp-apps-middleware";

const agent = new BuiltInAgent({
  model: "openai/gpt-4o",
  prompt: "...",
}).use(
  new MCPAppsMiddleware({
    mcpServers: [{ type: "http", url: process.env.MCP_SERVER_URL }],
  }),
);

const runtime = new CopilotRuntime({
  agents: { default: agent },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({ runtime, basePath: "/api/copilotkit" });
export const GET = handle(app);
export const POST = handle(app);
```

### 4. CSS Import (`src/app/layout.tsx`)

**Before:**

```typescript
import "@copilotkit/react-ui/styles.css";
```

**After:**

```typescript
import "@copilotkitnext/react/styles.css";
```

## Why This Works

1. **AG-UI Protocol**: The new packages use the AG-UI protocol for agent communication
2. **Built-in Agent**: `BuiltInAgent` provides a complete agent implementation with middleware support
3. **Hono Endpoint**: Uses Hono framework for better performance and Next.js integration
4. **InMemoryAgentRunner**: Manages agent execution state in memory

## Key Learnings

1. Always check the official demo repository for the latest API patterns
2. The `@copilotkitnext/*` packages are the future of CopilotKit
3. AG-UI protocol replaces the old GraphQL-based messaging
4. Middleware pattern enables clean MCP server integration

## References

- Official Demo: https://github.com/CopilotKit/mcp-apps-demo
- CopilotKit Documentation: https://copilotkit.ai
