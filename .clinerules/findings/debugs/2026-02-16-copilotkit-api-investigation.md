# Debug: CopilotKit API Investigation

**Date:** 2026-02-16
**Related Issue:** 2026-02-16-copilotkit-api-deprecation.md

## Investigation Steps

### 1. Initial Error

User reported TypeScript errors:

- `Cannot find name 'TextMessage'`
- `Cannot find name 'MessageRole'`

These were being imported from `@copilotkit/runtime-client-gql`.

### 2. Search for Types

Searched node_modules for the correct import paths:

```bash
# Found TextMessage in runtime-client-gql
node_modules/@copilotkit/runtime-client-gql/dist/graphql/messages.d.ts
```

### 3. Checked Type Definitions

Read `use-copilot-chat.d.ts` and `use-copilot-chat_internal.d.ts` from node_modules.

**Key Findings:**

1. `appendMessage` is **deprecated**:

   ```typescript
   /** @deprecated use `sendMessage` in `useCopilotChatHeadless_c` instead. */
   appendMessage: (message: Message$1, options?: AppendMessageOptions) =>
     Promise<void>;
   ```

2. New `sendMessage` uses AG-UI format:

   ```typescript
   sendMessage: (message: Message, options?: AppendMessageOptions) =>
     Promise<void>;
   ```

3. The `Message` type is from `@copilotkit/shared`, NOT `TextMessage` from `runtime-client-gql`

### 4. Checked Official Demo

Fetched the official mcp-apps-demo source:

```bash
curl -s https://raw.githubusercontent.com/CopilotKit/mcp-apps-demo/main/src/app/page.tsx
```

**Official Demo Uses:**

- `@copilotkitnext/react` (NOT `@copilotkit/react-core`)
- `useAgent` hook with `DEFAULT_AGENT_ID`
- `useCopilotKit` hook for `copilotkit.runAgent()`
- `agent.addMessage()` instead of `appendMessage()`

## Key Differences

| Old API                      | New API                                   |
| ---------------------------- | ----------------------------------------- |
| `@copilotkit/react-core`     | `@copilotkitnext/react`                   |
| `useCopilotChat()`           | `useAgent() + useCopilotKit()`            |
| `appendMessage(TextMessage)` | `agent.addMessage({id, role, content})`   |
| `TextMessage` class          | Plain object with `id`, `role`, `content` |
| `MessageRole.User` enum      | String `"user"`                           |

## Conclusion

The CopilotKit API has evolved significantly. The official mcp-apps-demo uses the new AG-UI protocol with `@copilotkitnext/*` packages, which require a completely different approach:

1. Use `CopilotKitProvider` instead of `CopilotKit`
2. Use `useAgent` to get the agent instance
3. Use `agent.addMessage()` to add messages
4. Use `copilotkit.runAgent({ agent })` to trigger the agent

## Reference

- Official Demo: https://github.com/CopilotKit/mcp-apps-demo/blob/main/src/app/page.tsx
