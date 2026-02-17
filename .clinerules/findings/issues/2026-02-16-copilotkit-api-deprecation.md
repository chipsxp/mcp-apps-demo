# Issue: CopilotKit API Deprecation - TextMessage Not Found

**Date:** 2026-02-16
**Status:** RESOLVED
**Severity:** High - Blocking compilation

## Symptom

TypeScript errors when using CopilotKit hooks:

```
Cannot find name 'TextMessage'.
Cannot find name 'MessageRole'.
```

The following code pattern was failing:

```typescript
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";

const { appendMessage } = useCopilotChat();
await appendMessage(
  new TextMessage({ role: MessageRole.User, content: message }),
);
```

## Root Cause

The `@copilotkit/react-core` package with `useCopilotChat`, `TextMessage`, and `MessageRole` is the **old deprecated API**. The official mcp-apps-demo repository uses the newer `@copilotkitnext/react` package with a completely different API.

## Affected Files

- `src/app/page.tsx`
- `package.json`

## Impact

Application would not compile. The entire approach to sending messages to the AI agent needed to be rewritten.

## Resolution

Migrated to the new `@copilotkitnext/react` API:

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

// Send message using new API
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

## Related Files

- Solution: `2026-02-16-copilotkit-next-migration.md`
- Debug: `2026-02-16-copilotkit-api-investigation.md`
