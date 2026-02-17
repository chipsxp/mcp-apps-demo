# Session Summary: CopilotKit Migration & MCP Apps Setup

**Date:** 2026-02-16
**Session Focus:** Migrating from old CopilotKit API to new `@copilotkitnext/*` packages

## Overview

This session focused on resolving build and runtime errors caused by using deprecated CopilotKit APIs. The project was updated to match the official mcp-apps-demo repository patterns.

## Issues Resolved

### 1. CopilotKit API Deprecation

- **Issue:** `TextMessage` and `MessageRole` not found
- **Root Cause:** Old `@copilotkit/react-core` API deprecated
- **Solution:** Migrated to `@copilotkitnext/react` with new hooks pattern

### 2. Agent Not Found Error

- **Issue:** `POST /api/copilotkit/agent/default/connect 404`
- **Root Cause:** Agents not properly registered with new runtime
- **Solution:** Used `BuiltInAgent` with explicit `agents: { default: agent }` config

### 3. CSS Import Path Error

- **Issue:** Package path not exported error
- **Root Cause:** Wrong import path `./dist/styles.css`
- **Solution:** Use `@copilotkitnext/react/styles.css`

### 4. ESLint Config Import Error

- **Issue:** Cannot find module `eslint-config-next/core-web-vitals`
- **Root Cause:** Missing `.js` extension in ESM imports
- **Solution:** Add `.js` extension to subpath imports

### 5. Trading App JS 404

- **Issue:** `/trading-app.js` returning 404
- **Root Cause:** Vite extracting `type="module"` scripts to separate files
- **Solution:** Use plain `<script>` tags for inline JavaScript

## Package Changes

### Added

```
@copilotkitnext/react: 1.51.0-next.4
@copilotkitnext/runtime: 1.51.0-next.4
@copilotkitnext/agent: 1.51.0-next.4
@copilotkitnext/core: 1.51.0-next.4
@copilotkitnext/shared: 1.51.0-next.4
@ag-ui/client: ^0.0.42
@ag-ui/encoder: ^0.0.42
@ag-ui/mcp-apps-middleware: ^0.0.1
hono: ^4.11.3
```

### Removed

```
@copilotkit/react-core
@copilotkit/react-ui
@copilotkit/runtime
```

## Current Status

### Working

- ✅ Next.js dev server starts successfully
- ✅ Agent connections working (`POST /api/copilotkit/agent/default/connect 200`)
- ✅ MCP middleware configured
- ✅ CSS styles loading correctly

### Pending

- ⏳ Full testing of all 4 MCP apps (Flights, Hotels, Trading, Kanban)
- ⏳ MCP server must be running on port 3001 for apps to work

## Environment Setup

Required in `.env.local`:

```
OPENAI_API_KEY=sk-...
MCP_SERVER_URL=http://localhost:3001/mcp
```

## Key Commands

```bash
# Start Next.js dev server
npm run dev

# Start MCP server (separate terminal)
cd mcp-server && npm run dev

# Build MCP app HTML files
npm run mcp:build
```

## Architecture Pattern

```
Next.js (Port 3000)
    ↓
CopilotKitProvider + useAgent
    ↓
API Route (/api/copilotkit)
    ↓
BuiltInAgent + MCPAppsMiddleware
    ↓
MCP Server (Port 3001/mcp)
    ↓
Tools + HTML Resources (ui://flights/flights-app.html)
```

## Next Steps

1. Test all 4 MCP apps with interactive prompts
2. Verify iframe communication works correctly
3. Deploy to Railway/Vercel
4. Add more MCP apps as needed

## References

- Official Demo: https://github.com/CopilotKit/mcp-apps-demo
- CopilotKit Docs: https://copilotkit.ai
- AG-UI Protocol: https://github.com/ag-ui-protocol/ag-ui
