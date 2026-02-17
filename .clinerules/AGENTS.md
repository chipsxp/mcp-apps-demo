# MCP Apps Library - Agent Memory

**Project:** MCP Apps Library with Fluid Grid UI  
**Created:** 2025-02-11  
**Status:** Workflow & Skills Complete

---

## Project Overview

A **pluggable MCP Apps Library** that displays AI applications as library cards in a fluid, responsive grid. Users can:

- Double-click cards to toggle app connections
- Connect multiple apps simultaneously to a supervisor LLM
- Manage app configurations via file-based persistence
- Experience glassmorphism UI design

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Apps Library (Frontend)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Fluid Grid + Glassmorphism UI               │   │
│  │  [✈️ Flights] [🏨 Hotels] [📈 Trading] [📋 Kanban]      │   │
│  │       Connected    Connect    Connect   Connected       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│              Zustand Store (connection state)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CopilotKit + MCPAppsMiddleware                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   filterTools() based on connectedApps[]                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Bun)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   Tools      │  │  Resources   │  │   HTML Apps      │      │
│  │ search-*     │  │ ui://app.html│  │  (iframes)       │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions

### 1. Connection Model: Toggle per App

- **Decision:** Allow multiple apps to be connected simultaneously
- **Rationale:** Enables complex multi-app workflows (e.g., book flight + hotel)
- **Implementation:** Zustand store with `Set<string>` for `connectedApps`
- **Status:** ✅ Documented in workflow

### 2. Persistence Strategy

- **Decision:** Dual persistence approach
  - **Connection state:** localStorage (Zustand persist)
  - **App configuration:** File-based (`config/mcp-apps.config.json`)
- **Rationale:** Connections are user-specific, config is deploy-specific
- **Status:** ✅ Documented in workflow

### 3. Design System: Glassmorphism

- **Decision:** Continue existing glassmorphism aesthetic
- **Elements:**
  - Backdrop blur (`backdrop-filter: blur(12px)`)
  - Semi-transparent backgrounds (`rgba(255,255,255,0.05)`)
  - Animated gradient blobs
  - Smooth transitions and hover effects
- **Status:** ✅ Complete CSS system in workflow

### 4. Runtime: Bun (Not Hono)

- **Decision:** Use Bun throughout the stack
- **Usage:**
  - Package management
  - Next.js development server
  - MCP server (native `Bun.serve()`)
  - No Express, no Hono
- **Rationale:** Faster, TypeScript-native, simpler deployment
- **Status:** ✅ Full Bun workflow documented

### 5. App Registry: Hardcoded with Config Overlay

- **Decision:** Hardcoded TypeScript registry with JSON config overlay
- **Structure:** `src/lib/apps-registry.ts` + `config/mcp-apps.config.json`
- **Rationale:** Type safety + runtime configurability
- **Status:** ✅ Pattern documented

---

## Architecture Patterns

### Pattern 1: Tool Registration with UI Resource

```typescript
{
  name: "search-flights",
  inputSchema: { ... },
  _meta: {
    "ui/resourceUri": "ui://flights/flights-app.html"
  }
}
```

### Pattern 2: Dynamic Tool Filtering

```typescript
filterTools: async (tools, context) => {
  const connectedApps = context.properties?.connectedApps || [];
  return tools.filter((tool) => {
    const uri = tool._meta?.["ui/resourceUri"];
    if (!uri) return true;
    const appId = uri.match(/ui:\/\/([^/]+)/)?.[1];
    return appId && connectedApps.includes(appId);
  });
};
```

### Pattern 3: Zustand with Set Persistence

```typescript
export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: "mcp-apps-connections",
      partialize: (state) => ({
        connectedApps: Array.from(state.connectedApps),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.connectedApps = new Set(state.connectedApps);
        }
      },
    }
  )
);
```

### Pattern 4: Bidirectional iframe Communication

```javascript
// JSON-RPC over postMessage
const MCPApp = {
  sendRequest: (method, params) => { ... },
  sendNotification: (method, params) => { ... },
  onNotification: (method, handler) => { ... }
};
```

---

## File Structure

```
.clinerules/
├── AGENTS.md                      # This file
├── workflows/
│   └── nextjs-bun-mcp.md         # Complete workflow
├── skills/
│   ├── nextjs/SKILL.md           # Next.js patterns
│   ├── bunjs/SKILL.md            # Bun workflow
│   └── mcp-apps/SKILL.md         # MCP dynamic loading
└── findings/                     # Memory recording
    ├── issues/                   # Recorded bugs
    ├── debugs/                   # Debug sessions
    └── solutions/                # Resolved solutions

mcp-apps-library/                 # Project (to be created)
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/copilotkit/route.ts
│   ├── components/
│   │   └── library/
│   │       ├── AppCard.tsx
│   │       ├── AppGrid.tsx
│   │       └── ConnectionStatus.tsx
│   ├── lib/
│   │   ├── apps-registry.ts
│   │   ├── connection-store.ts
│   │   └── config-loader.ts
│   └── types/
│       └── mcp-app.ts
├── config/
│   └── mcp-apps.config.json
├── mcp-server/
│   ├── server.ts
│   └── apps/
│       ├── flights-app.html
│       ├── hotels-app.html
│       ├── trading-app.html
│       └── kanban-app.html
└── package.json
```

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Initialize project with `bun init`
- [ ] Install Next.js + CopilotKit dependencies
- [ ] Set up project structure
- [ ] Create TypeScript interfaces

### Phase 2: Core Components

- [ ] Create glassmorphism CSS system
- [ ] Implement AppCard component
- [ ] Implement AppGrid component
- [ ] Create Zustand connection store

### Phase 3: MCP Integration

- [ ] Set up Bun MCP server
- [ ] Register tools with UI resources
- [ ] Implement resource serving
- [ ] Configure MCPAppsMiddleware

### Phase 4: UI Polish

- [ ] Add animated background
- [ ] Implement responsive design
- [ ] Add connection status indicator
- [ ] Test double-click interactions

### Phase 5: Configuration

- [ ] Create file-based config loader
- [ ] Implement config merging
- [ ] Add app enable/disable functionality

### Phase 6: Testing & Deployment

- [ ] Test multi-app connections
- [ ] Verify tool filtering
- [ ] Test iframe communication
- [ ] Deploy to Railway/Vercel

---

## References

### Documentation

- [MCP Specification](https://modelcontextprotocol.io)
- [CopilotKit Docs](https://copilotkit.ai)
- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)
- [Bun Documentation](https://bun.sh/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)

### Package Versions

- `next`: ^16.0.0
- `@copilotkitnext/*`: 1.51.0-next.4
- `@ag-ui/mcp-apps-middleware`: ^0.0.1
- `@modelcontextprotocol/sdk`: ^1.0.0
- `zustand`: ^5.0.0
- `zod`: ^3.25.75
- `bun`: latest

---

## Memory System

### Issues Folder

Record bugs and problems encountered:

- Date-prefixed filenames: `YYYY-MM-DD-brief-description.md`
- Include: Error messages, reproduction steps, environment

### Debugs Folder

Document debugging sessions:

- What was investigated
- Tools used
- Findings along the way

### Solutions Folder

Capture resolved solutions:

- The fix that worked
- Why it worked
- References to relevant issues/debugs

---

## Notes

### Future Enhancements

- [ ] Drag-and-drop card reordering
- [ ] Search/filter functionality
- [ ] App marketplace integration
- [ ] User-defined custom apps
- [ ] Real-time collaboration

### Performance Considerations

- Lazy load MCP apps (iframe on demand)
- Debounce connection toggles
- Virtualize grid for large app libraries
- Cache tool schemas

### Security Considerations

- Sanitize all user inputs
- Validate resource URIs
- CSP headers for iframe sandbox
- Rate limiting on MCP server

---

## Session History

### 2026-02-16: CopilotKit Next Migration

**Major Changes:**

- Migrated from `@copilotkit/react-core` to `@copilotkitnext/react`
- Updated API route to use `BuiltInAgent` with `MCPAppsMiddleware`
- Fixed CSS import paths and ESLint config issues
- Fixed trading-app.html script extraction issue

**Findings Recorded:**

- Issues: 5 issues resolved (API deprecation, agent not found, CSS import, ESLint, trading JS 404)
- Debugs: 2 investigations (API investigation, script type module)
- Solutions: 2 solutions (CopilotKit migration, script consistency)
- Notes: Session summary with architecture and next steps

**Current Package Versions:**

- `next`: ^15.1.0
- `@copilotkitnext/*`: 1.51.0-next.4
- `@ag-ui/mcp-apps-middleware`: ^0.0.1
- `hono`: ^4.11.3
- `react`: ^19.0.0

---

**Last Updated:** 2026-02-16  
**Next Review:** Test MCP apps functionality
