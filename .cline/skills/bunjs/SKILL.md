---
name: bunjs
description: Bun runtime patterns for MCP Apps Library - package management, development server, and production builds
---

# Bun.js Skill - MCP Apps Library

## Overview

Bun runtime patterns for the MCP Apps Library project. Bun is used for:

- Package management (faster than npm/yarn/pnpm)
- Development server (both Next.js and MCP server)
- Production builds
- Script execution

---

## Why Bun?

| Feature         | Bun         | Node.js                |
| --------------- | ----------- | ---------------------- |
| Install speed   | 3-5x faster | Baseline               |
| TypeScript      | Native      | Requires ts-node       |
| Bundling        | Built-in    | Requires webpack/etc   |
| Test runner     | Built-in    | Requires jest/vitest   |
| Package manager | Built-in    | Requires npm/yarn/pnpm |

**Key Decision:** Use Bun throughout - no Hono, no Express in MCP server either.

---

## Project Initialization

### 1. Create New Project

```bash
# Create directory
mkdir mcp-apps-library
cd mcp-apps-library

# Initialize with Bun
bun init -y

# This creates:
# - package.json
# - tsconfig.json
# - bun.lockb (lockfile)
# - README.md
```

### 2. Install Dependencies

```bash
# Next.js core
bun add next@16 react react-dom

# CopilotKit packages
bun add @copilotkitnext/react@1.51.0-next.4
bun add @copilotkitnext/core@1.51.0-next.4
bun add @copilotkitnext/runtime@1.51.0-next.4
bun add @copilotkitnext/agent@1.51.0-next.4
bun add @copilotkitnext/shared@1.51.0-next.4

# MCP & AG-UI
bun add @ag-ui/mcp-apps-middleware
bun add @modelcontextprotocol/sdk

# State management & utilities
bun add zustand zod clsx tailwind-merge

# Dev dependencies
bun add -d @types/react @types/node typescript
```

### 3. MCP Server Dependencies

```bash
cd mcp-server
bun init -y

bun add @modelcontextprotocol/sdk zod
```

**File:** `mcp-server/package.json`

```json
{
  "name": "mcp-apps-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch server.ts",
    "start": "bun server.ts",
    "build": "echo 'No build needed with Bun'"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.25.75"
  }
}
```

---

## Development Workflow

### Project Structure

```
mcp-apps-library/
├── package.json              # Root package.json (Bun)
├── bun.lockb                 # Bun lockfile
├── next.config.ts
├── src/                      # Next.js frontend
├── mcp-server/
│   ├── package.json          # MCP server package.json
│   ├── bun.lockb
│   └── server.ts             # Bun MCP server
└── config/
    └── mcp-apps.config.json
```

### Root package.json

```json
{
  "name": "mcp-apps-library",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "server:dev": "bun --cwd mcp-server dev",
    "server:start": "bun --cwd mcp-server start",
    "dev:all": "concurrently \"bun dev\" \"bun server:dev\""
  },
  "dependencies": {
    "@ag-ui/mcp-apps-middleware": "^0.0.1",
    "@copilotkitnext/agent": "1.51.0-next.4",
    "@copilotkitnext/core": "1.51.0-next.4",
    "@copilotkitnext/react": "1.51.0-next.4",
    "@copilotkitnext/runtime": "1.51.0-next.4",
    "@copilotkitnext/shared": "1.51.0-next.4",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "clsx": "^2.1.0",
    "next": "16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^3.25.75",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Development Commands

```bash
# Install all dependencies
bun install
cd mcp-server && bun install && cd ..

# Run only Next.js frontend
bun dev

# Run only MCP server
bun server:dev

# Run both concurrently (install concurrently first: bun add -d concurrently)
bun dev:all

# Build for production
bun run build

# Start production server
bun start
```

---

## Bun MCP Server

### Basic Server Setup

```typescript
// mcp-server/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const PORT = process.env.PORT || 3001;

// Bun.serve() - Native HTTP server
const httpServer = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return handleSSEConnection(request);
    }

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", timestamp: Date.now() });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 MCP Server running on http://localhost:${PORT}`);

// MCP Protocol Server
const mcpServer = new Server(
  { name: "mcp-apps-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } },
);

// Tool handlers
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: registeredTools };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return await executeTool(name, args);
});

// Resource handlers for MCP Apps
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: registeredResources };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return await loadResource(uri);
});

// SSE Connection handler
async function handleSSEConnection(request: Request): Promise<Response> {
  const { signal } = request;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial endpoint event
      const endpoint = `/mcp/messages?sessionId=${generateSessionId()}`;
      controller.enqueue(`event: endpoint\ndata: ${endpoint}\n\n`);

      // Handle cleanup on abort
      signal.addEventListener("abort", () => {
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Hot Reload with Bun

```bash
# Development with hot reload
bun --watch server.ts

# Bun automatically restarts the server when files change
```

---

## File Operations with Bun

### Reading Config Files

```typescript
// src/lib/config-loader.ts
import { readFile } from "fs/promises";
import { join } from "path";

export async function loadConfig(): Promise<MCPAppsConfig> {
  const configPath = join(process.cwd(), "config", "mcp-apps.config.json");
  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content);
}

// Alternative using Bun.file() - Bun-specific API
export async function loadConfigBun(): Promise<MCPAppsConfig> {
  const file = Bun.file("./config/mcp-apps.config.json");
  return await file.json();
}
```

### Writing Config Files

```typescript
// Save user preferences
export async function saveConfig(config: MCPAppsConfig): Promise<void> {
  const configPath = join(process.cwd(), "config", "mcp-apps.config.json");
  await Bun.write(configPath, JSON.stringify(config, null, 2));
}
```

---

## Environment Variables

### .env.local

```bash
# API Keys
OPENAI_API_KEY=sk-...

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_PORT=3001

# Next.js Configuration
NEXT_PUBLIC_APP_NAME="MCP Apps Library"

# Optional: Debug mode
DEBUG=mcp:*
```

### Access in Code

```typescript
// Server-side (Node.js compatible)
const apiKey = process.env.OPENAI_API_KEY;
const mcpUrl = process.env.MCP_SERVER_URL || "http://localhost:3001";

// Bun also supports Bun.env (Bun-specific)
const apiKeyBun = Bun.env.OPENAI_API_KEY;
```

---

## TypeScript Configuration

### Root tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### MCP Server tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Production Deployment

### Build Steps

```bash
# 1. Install dependencies
bun install
cd mcp-server && bun install && cd ..

# 2. Build Next.js
bun run build

# 3. No build needed for Bun MCP server (runs directly)
```

### Docker with Bun

```dockerfile
# Dockerfile
FROM oven/bun:1 as base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY mcp-server/package.json mcp-server/bun.lockb ./mcp-server/

# Install dependencies
RUN bun install --frozen-lockfile
RUN cd mcp-server && bun install --frozen-lockfile

# Copy source
COPY . .

# Build Next.js
RUN bun run build

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["bun", "run", "start:all"]
```

### Railway/Docker Deployment

```json
// package.json scripts for deployment
{
  "scripts": {
    "start:all": "concurrently \"bun start\" \"bun server:start\"",
    "start": "next start",
    "server:start": "bun --cwd mcp-server start"
  }
}
```

---

## Common Bun Commands

| Task            | Command                 |
| --------------- | ----------------------- |
| Install deps    | `bun install`           |
| Add package     | `bun add <package>`     |
| Add dev package | `bun add -d <package>`  |
| Run script      | `bun run <script>`      |
| Run TypeScript  | `bun <file>.ts`         |
| Watch mode      | `bun --watch <file>.ts` |
| Test            | `bun test`              |
| Upgrade Bun     | `bun upgrade`           |

---

## Troubleshooting

### Lockfile Issues

```bash
# Regenerate lockfile
rm bun.lockb
bun install
```

### Module Resolution

```bash
# Clear Bun cache
bun pm cache rm

# Reinstall
bun install
```

### TypeScript Errors

```bash
# Type-check without emitting
bun tsc --noEmit
```

---

## Best Practices

1. **Use `--frozen-lockfile` in CI** - Ensures reproducible builds
2. **Commit `bun.lockb`** - Lockfile should be in version control
3. **Use `Bun.file()` for simple reads** - More efficient than fs/promises
4. **Leverage `--watch` for development** - Native hot reload
5. **No build step for MCP server** - Bun runs TypeScript directly
6. **Use `type: "module"`** - ES modules throughout
