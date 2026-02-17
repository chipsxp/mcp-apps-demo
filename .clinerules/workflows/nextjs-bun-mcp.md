# MCP Apps Library Workflow

## Overview

This workflow creates a **Library-style MCP Apps Manager** with a fluid grid UI where users can:

- View MCP apps as library cards in a responsive grid
- Double-click cards to toggle connect/disconnect
- Connect multiple apps simultaneously to the supervisor LLM
- Manage app configurations via file-based persistence

**Tech Stack:** Next.js 16 + Bun + MCP Apps (CopilotKit + AG-UI)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MCP Apps Library                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Fluid Grid Layout                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │ ✈️       │ │ 🏨       │ │ 📈       │ │ 📋       │              │   │
│  │  │ Flights  │ │ Hotels   │ │ Trading  │ │ Kanban   │    ...       │   │
│  │  │[Connected]│ │[Connect] │ │[Connect] │ │[Connected]│              │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Connection Status: 2 apps active  │  [Disconnect All]                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Supervisor LLM (CopilotKit)                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ User: "Book a flight and check my portfolio"                          │  │
│  │                                                                       │  │
│  │ AI: [Uses connected Flights + Trading app tools]                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Project Setup

### 1.1 Initialize with Bun

```bash
# Create project directory
mkdir mcp-apps-library
cd mcp-apps-library

# Initialize with Bun
bun init -y

# Install Next.js and dependencies
bun add next@16 react react-dom
bun add -d @types/react @types/node typescript
```

### 1.2 Install MCP Dependencies

```bash
# CopilotKit packages (MCP Apps support)
bun add @copilotkitnext/react@1.51.0-next.4
bun add @copilotkitnext/core@1.51.0-next.4
bun add @copilotkitnext/runtime@1.51.0-next.4
bun add @copilotkitnext/agent@1.51.0-next.4
bun add @copilotkitnext/shared@1.51.0-next.4

# AG-UI MCP Apps Middleware
bun add @ag-ui/mcp-apps-middleware

# MCP SDK
bun add @modelcontextprotocol/sdk

# State management
bun add zustand

# Utilities
bun add zod clsx tailwind-merge
```

### 1.3 Project Structure

```
mcp-apps-library/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Library grid UI
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles + glassmorphism
│   │   └── api/
│   │       └── copilotkit/
│   │           └── route.ts      # CopilotKit + MCPAppsMiddleware
│   ├── components/
│   │   ├── library/
│   │   │   ├── AppCard.tsx       # Individual library card
│   │   │   ├── AppGrid.tsx       # Fluid grid container
│   │   │   └── ConnectionStatus.tsx
│   │   └── ui/                   # Shared UI components
│   ├── lib/
│   │   ├── apps-registry.ts      # Hardcoded app definitions
│   │   ├── connection-store.ts   # Zustand store for connections
│   │   └── config-loader.ts      # File-based config utilities
│   └── types/
│       └── mcp-app.ts            # TypeScript interfaces
├── config/
│   └── mcp-apps.config.json      # File-based app configuration
├── mcp-server/
│   ├── server.ts                 # Bun MCP server
│   └── apps/                     # MCP app HTML files
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Phase 2: Core Components

### 2.1 TypeScript Interfaces

**File:** `src/types/mcp-app.ts`

```typescript
export interface MCPApp {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG string or component name
  category: AppCategory;
  tools: ToolDefinition[];
  resourceUri: string; // ui://namespace/app.html
  config: AppConfig;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  meta?: {
    "ui/resourceUri"?: string;
  };
}

export interface AppConfig {
  enabled: boolean;
  defaultOpen: boolean;
  metadata?: Record<string, any>;
}

export type AppCategory = "travel" | "finance" | "productivity" | "utilities";

export interface ConnectionState {
  connectedApps: Set<string>;
  activeApp: string | null;
  toggleConnection: (appId: string) => void;
  disconnectAll: () => void;
  isConnected: (appId: string) => boolean;
}
```

### 2.2 App Registry (Hardcoded)

**File:** `src/lib/apps-registry.ts`

```typescript
import { MCPApp } from "@/types/mcp-app";

export const appsRegistry: MCPApp[] = [
  {
    id: "flights",
    name: "Airline Booking",
    description: "Search flights, select seats, and complete bookings",
    icon: "plane",
    category: "travel",
    resourceUri: "ui://flights/flights-app.html",
    tools: [
      {
        name: "search-flights",
        description: "Search available flights",
        inputSchema: z.object({ origin: z.string(), destination: z.string(), ... }),
        meta: { "ui/resourceUri": "ui://flights/flights-app.html" }
      },
      // ... more tools
    ],
    config: { enabled: true, defaultOpen: false }
  },
  {
    id: "hotels",
    name: "Hotel Booking",
    description: "Browse hotels and book accommodations",
    icon: "building",
    category: "travel",
    resourceUri: "ui://hotels/hotels-app.html",
    tools: [ /* ... */ ],
    config: { enabled: true, defaultOpen: false }
  },
  {
    id: "trading",
    name: "Investment Simulator",
    description: "Build portfolios and execute trades",
    icon: "trendingUp",
    category: "finance",
    resourceUri: "ui://trading/trading-app.html",
    tools: [ /* ... */ ],
    config: { enabled: true, defaultOpen: false }
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Manage projects with drag-drop cards",
    icon: "layoutGrid",
    category: "productivity",
    resourceUri: "ui://kanban/kanban-app.html",
    tools: [ /* ... */ ],
    config: { enabled: true, defaultOpen: false }
  }
];

export function getAppById(id: string): MCPApp | undefined {
  return appsRegistry.find(app => app.id === id);
}

export function getConnectedApps(connectedIds: string[]): MCPApp[] {
  return appsRegistry.filter(app => connectedIds.includes(app.id));
}
```

### 2.3 Connection State Store (Zustand)

**File:** `src/lib/connection-store.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ConnectionState } from "@/types/mcp-app";

interface ConnectionStore extends ConnectionState {
  setActiveApp: (appId: string | null) => void;
  connectApp: (appId: string) => void;
  disconnectApp: (appId: string) => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      // State
      connectedApps: new Set<string>(),
      activeApp: null,

      // Actions
      toggleConnection: (appId: string) => {
        const { connectedApps } = get();
        const newSet = new Set(connectedApps);
        if (newSet.has(appId)) {
          newSet.delete(appId);
        } else {
          newSet.add(appId);
        }
        set({ connectedApps: newSet });
      },

      connectApp: (appId: string) => {
        const { connectedApps } = get();
        const newSet = new Set(connectedApps);
        newSet.add(appId);
        set({ connectedApps: newSet });
      },

      disconnectApp: (appId: string) => {
        const { connectedApps } = get();
        const newSet = new Set(connectedApps);
        newSet.delete(appId);
        set({ connectedApps: newSet });
      },

      disconnectAll: () => {
        set({ connectedApps: new Set<string>(), activeApp: null });
      },

      isConnected: (appId: string) => {
        return get().connectedApps.has(appId);
      },

      setActiveApp: (appId: string | null) => {
        set({ activeApp: appId });
      },
    }),
    {
      name: "mcp-apps-connections",
      storage: createJSONStorage(() => localStorage),
      // Serialize Set to Array for storage
      partialize: (state) => ({
        connectedApps: Array.from(state.connectedApps),
        activeApp: state.activeApp,
      }),
      // Deserialize Array back to Set
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.connectedApps = new Set(state.connectedApps);
        }
      },
    },
  ),
);
```

### 2.4 File-Based Configuration

**File:** `config/mcp-apps.config.json`

```json
{
  "apps": {
    "flights": {
      "enabled": true,
      "defaultOpen": false,
      "metadata": {
        "defaultOrigin": "NYC",
        "preferredAirlines": ["AA", "UA", "DL"]
      }
    },
    "hotels": {
      "enabled": true,
      "defaultOpen": false,
      "metadata": {
        "defaultCity": "New York"
      }
    },
    "trading": {
      "enabled": true,
      "defaultOpen": false,
      "metadata": {
        "defaultBalance": 10000
      }
    },
    "kanban": {
      "enabled": true,
      "defaultOpen": false,
      "metadata": {
        "defaultTemplate": "software"
      }
    }
  },
  "ui": {
    "gridColumns": {
      "mobile": 1,
      "tablet": 2,
      "desktop": 3,
      "wide": 4
    },
    "theme": "glassmorphism"
  }
}
```

**File:** `src/lib/config-loader.ts`

```typescript
import { promises as fs } from "fs";
import path from "path";
import { MCPApp } from "@/types/mcp-app";

export interface AppConfig {
  enabled: boolean;
  defaultOpen: boolean;
  metadata?: Record<string, any>;
}

export interface UIConfig {
  gridColumns: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  theme: string;
}

export interface MCPAppsConfig {
  apps: Record<string, AppConfig>;
  ui: UIConfig;
}

// Load config from file (server-side only)
export async function loadConfig(): Promise<MCPAppsConfig> {
  const configPath = path.join(process.cwd(), "config", "mcp-apps.config.json");
  const fileContent = await fs.readFile(configPath, "utf-8");
  return JSON.parse(fileContent);
}

// Merge config with registry
export function mergeConfigWithRegistry(
  apps: MCPApp[],
  config: MCPAppsConfig,
): MCPApp[] {
  return apps.map((app) => ({
    ...app,
    config: config.apps[app.id] || app.config,
  }));
}

// Get active apps based on config
export function getEnabledApps(
  apps: MCPApp[],
  config: MCPAppsConfig,
): MCPApp[] {
  return apps.filter((app) => config.apps[app.id]?.enabled !== false);
}
```

---

## Phase 3: UI Components (Glassmorphism)

### 3.1 Global Styles

**File:** `src/app/globals.css`

```css
/* Glassmorphism Design System */
:root {
  /* Colors */
  --color-bg-primary: #0f0f1a;
  --color-bg-secondary: #1a1a2e;
  --color-bg-glass: rgba(255, 255, 255, 0.05);
  --color-bg-glass-hover: rgba(255, 255, 255, 0.1);
  --color-bg-glass-active: rgba(255, 255, 255, 0.15);

  /* Accents */
  --color-lilac: #a78bfa;
  --color-mint: #34d399;
  --color-rose: #fb7185;
  --color-amber: #fbbf24;
  --color-sky: #38bdf8;

  /* Text */
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;

  /* Border */
  --border-glass: 1px solid rgba(255, 255, 255, 0.1);

  /* Shadow */
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(167, 139, 250, 0.3);
}

/* Base */
* {
  box-sizing: border-box;
}

body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  min-height: 100vh;
}

/* Glassmorphism Card */
.glass-card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: var(--border-glass);
  border-radius: 16px;
  box-shadow: var(--shadow-glass);
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: var(--color-bg-glass-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-glass), var(--shadow-glow);
}

.glass-card.active {
  background: var(--color-bg-glass-active);
  border-color: var(--color-lilac);
  box-shadow:
    var(--shadow-glass),
    0 0 30px rgba(167, 139, 250, 0.4);
}

/* Status Indicators */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.connected {
  background: var(--color-mint);
  box-shadow: 0 0 8px var(--color-mint);
}

.status-dot.disconnected {
  background: var(--color-text-tertiary);
}

/* Connection Button */
.connect-btn {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.connect-btn.connect {
  background: transparent;
  border: 1px solid var(--color-lilac);
  color: var(--color-lilac);
}

.connect-btn.connect:hover {
  background: var(--color-lilac);
  color: var(--color-bg-primary);
}

.connect-btn.disconnect {
  background: var(--color-rose);
  color: white;
}

.connect-btn.disconnect:hover {
  background: #f43f5e;
}

/* Fluid Grid */
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}

@media (min-width: 640px) {
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .app-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .app-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Animated Background */
.abstract-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.blob-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, var(--color-lilac), var(--color-rose));
  top: -200px;
  right: -200px;
}

.blob-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, var(--color-mint), var(--color-sky));
  bottom: -150px;
  left: -150px;
  animation-delay: -5s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
}

/* Double-click hint */
.double-click-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.glass-card:hover .double-click-hint {
  opacity: 1;
}
```

### 3.2 App Card Component

**File:** `src/components/library/AppCard.tsx`

```typescript
"use client";

import { useCallback } from "react";
import { MCPApp } from "@/types/mcp-app";
import { useConnectionStore } from "@/lib/connection-store";

interface AppCardProps {
  app: MCPApp;
}

// Icon mapping
const icons: Record<string, JSX.Element> = {
  plane: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  ),
  building: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="16" height="20" x="4" y="2" rx="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M12 6h.01"/><path d="M12 10h.01"/>
      <path d="M12 14h.01"/><path d="M16 10h.01"/>
      <path d="M16 14h.01"/><path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  trendingUp: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  layoutGrid: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  )
};

// Category colors
const categoryColors: Record<string, string> = {
  travel: "#38bdf8",
  finance: "#34d399",
  productivity: "#a78bfa",
  utilities: "#fbbf24"
};

export function AppCard({ app }: AppCardProps) {
  const { toggleConnection, isConnected } = useConnectionStore();
  const connected = isConnected(app.id);

  // Handle double-click to toggle
  const handleDoubleClick = useCallback(() => {
    toggleConnection(app.id);
  }, [app.id, toggleConnection]);

  // Handle button click
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleConnection(app.id);
  }, [app.id, toggleConnection]);

  const categoryColor = categoryColors[app.category] || "#94a3b8";

  return (
    <div
      className={`glass-card ${connected ? "active" : ""} relative p-6 cursor-pointer select-none`}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`${app.name} - ${connected ? "Connected" : "Disconnected"}`}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={`status-dot ${connected ? "connected" : "disconnected"}`} />
        {connected && (
          <span className="text-xs font-medium text-[var(--color-mint)]">
            Active
          </span>
        )}
      </div>

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}10)` }}
      >
        <div style={{ color: categoryColor }}>
          {icons[app.icon] || icons.layoutGrid}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {app.name}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 line-clamp-2">
        {app.description}
      </p>

      {/* Category Badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            background: `${categoryColor}20`,
            color: categoryColor
          }}
        >
          {app.category}
        </span>

        {/* Connect/Disconnect Button */}
        <button
          className={`connect-btn ${connected ? "disconnect" : "connect"}`}
          onClick={handleButtonClick}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>

      {/* Double-click hint */}
      <span className="double-click-hint">
        Double-click to {connected ? "disconnect" : "connect"}
      </span>
    </div>
  );
}
```

### 3.3 App Grid Component

**File:** `src/components/library/AppGrid.tsx`

```typescript
"use client";

import { useMemo } from "react";
import { MCPApp } from "@/types/mcp-app";
import { AppCard } from "./AppCard";
import { ConnectionStatus } from "./ConnectionStatus";

interface AppGridProps {
  apps: MCPApp[];
}

export function AppGrid({ apps }: AppGridProps) {
  // Group apps by category for potential sectioning
  const appsByCategory = useMemo(() => {
    const grouped: Record<string, MCPApp[]> = {};
    apps.forEach(app => {
      if (!grouped[app.category]) {
        grouped[app.category] = [];
      }
      grouped[app.category].push(app);
    });
    return grouped;
  }, [apps]);

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            App Library
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Double-click cards to connect apps to the AI supervisor
          </p>
        </div>
        <ConnectionStatus />
      </div>

      {/* Grid */}
      <div className="app-grid">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-12 glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-mint)]">•</span>
            <span><strong>Connect apps</strong> to enable their tools in the AI chat</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-mint)]">•</span>
            <span><strong>Multiple apps</strong> can be active simultaneously</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-mint)]">•</span>
            <span><strong>Double-click</strong> or use the Connect button to toggle</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-mint)]">•</span>
            <span><strong>Connected apps</strong> appear in the chat sidebar when in use</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
```

### 3.4 Connection Status Component

**File:** `src/components/library/ConnectionStatus.tsx`

```typescript
"use client";

import { useConnectionStore } from "@/lib/connection-store";
import { appsRegistry } from "@/lib/apps-registry";

export function ConnectionStatus() {
  const { connectedApps, disconnectAll } = useConnectionStore();
  const count = connectedApps.size;

  // Get names of connected apps
  const connectedNames = Array.from(connectedApps)
    .map(id => appsRegistry.find(app => app.id === id)?.name)
    .filter(Boolean);

  if (count === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
        <span className="status-dot disconnected" />
        <span>No apps connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="status-dot connected" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-mint)]">{count}</strong> app{count !== 1 ? "s" : ""} active
        </span>
        {count > 0 && (
          <span
            className="text-xs text-[var(--color-text-tertiary)] truncate max-w-[150px]"
            title={connectedNames.join(", ")}
          >
            ({connectedNames.join(", ")})
          </span>
        )}
      </div>
      <button
        onClick={disconnectAll}
        className="text-xs text-[var(--color-rose)] hover:text-[#f43f5e] transition-colors"
      >
        Disconnect All
      </button>
    </div>
  );
}
```

---

## Phase 4: Main Page & Layout

### 4.1 Main Page

**File:** `src/app/page.tsx`

```typescript
"use client";

import { CopilotKitProvider, CopilotSidebar, CopilotPopup, useAgent, useCopilotKit } from "@copilotkitnext/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AppGrid } from "@/components/library/AppGrid";
import { appsRegistry } from "@/lib/apps-registry";

export const dynamic = "force-dynamic";

export default function MCPAppsLibrary() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <AppLayout />
    </CopilotKitProvider>
  );
}

function AppLayout() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="abstract-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      {/* Hero Section */}
      <header className="relative z-10 text-center pt-12 pb-6 px-4">
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm text-[var(--color-text-secondary)] mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>MCP Apps Library</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
          Pluggable AI Apps
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-[var(--color-text-secondary)]">
          Connect MCP apps to your AI supervisor. Use multiple apps simultaneously
          for complex workflows.
        </p>
      </header>

      {/* App Grid */}
      <AppGrid apps={appsRegistry} />

      {/* CopilotKit Chat UI */}
      {isDesktop ? (
        <CopilotSidebar
          defaultOpen={false}
          width="40%"
        />
      ) : (
        <CopilotPopup
          defaultOpen={false}
          labels={{
            modalHeaderTitle: "AI Supervisor",
            chatInputPlaceholder: "Ask me anything...",
          }}
        />
      )}
    </div>
  );
}
```

### 4.2 Root Layout

**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Apps Library",
  description: "Pluggable AI apps with MCP protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## Phase 5: MCP Server with Bun

### 5.1 Bun MCP Server

> **Reference:** For detailed MCP patterns, tool registration, and communication modules, see `.cline/library/TECH-NOTES.md`

**File:** `mcp-server/server.ts`

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { join } from "path";

// Bun server
const PORT = process.env.PORT || 3001;
const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    // SSE endpoint for MCP
    if (url.pathname === "/mcp") {
      return handleMCPConnection(request);
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`MCP Server running on http://localhost:${PORT}`);

// MCP Server setup
const mcpServer = new Server(
  {
    name: "mcp-apps-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// Tool definitions with UI resource metadata
// See .cline/library/TECH-NOTES.md for detailed patterns
const RESOURCE_URI_META_KEY = "ui/resourceUri";

const tools = [
  {
    name: "search-flights",
    description: "Search for available flights",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
        departureDate: { type: "string" },
        passengers: { type: "number" },
      },
      required: ["origin", "destination", "departureDate"],
    },
    _meta: {
      [RESOURCE_URI_META_KEY]: "ui://flights/flights-app.html",
    },
  },
  // Add more tools...
];

// Tool handlers
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Route to appropriate handler
  switch (name) {
    case "search-flights":
      return handleSearchFlights(args);
    // Add more handlers...
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Resource handlers for MCP Apps
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "ui://flights/flights-app.html",
        mimeType: "text/html+mcp",
        name: "Flights App",
      },
      {
        uri: "ui://hotels/hotels-app.html",
        mimeType: "text/html+mcp",
        name: "Hotels App",
      },
    ],
  };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Load HTML file based on URI
  if (uri.startsWith("ui://")) {
    const path = uri.replace("ui://", "");
    const htmlPath = join(process.cwd(), "apps", path);
    const content = readFileSync(htmlPath, "utf-8");

    return {
      contents: [
        {
          uri,
          mimeType: "text/html+mcp",
          text: content,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Tool implementations
async function handleSearchFlights(args: any) {
  // Implementation...
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ flights: [] }),
      },
    ],
  };
}

// MCP Connection handler
async function handleMCPConnection(request: Request): Promise<Response> {
  // SSE transport setup would go here
  // This is simplified - full implementation needs SSE handling
  return new Response("MCP Endpoint", { status: 200 });
}
```

### 5.2 MCP App HTML Templates

> **Reference:** See `.cline/library/TECH-NOTES.md` for the complete bidirectional communication module pattern and `.cline/library/README.md` for project structure

The MCP apps (flights, hotels, trading, kanban) are self-contained HTML files that communicate with the server via JSON-RPC over postMessage. See the tech-notes for the communication module pattern.

### 5.2 Package.json for Bun

**File:** `mcp-server/package.json`

```json
{
  "name": "mcp-apps-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch server.ts",
    "start": "bun server.ts",
    "build": "echo 'No build step needed with Bun'"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.25.75"
  }
}
```

---

## Phase 6: CopilotKit Integration

### 6.1 API Route

**File:** `src/app/api/copilotkit/route.ts`

```typescript
import { NextRequest } from "next/server";
import { createCopilotEndpoint, CopilotRuntime } from "@copilotkitnext/runtime";
import { MCPAppsMiddleware } from "@ag-ui/mcp-apps-middleware";

const runtime = new CopilotRuntime();

// MCP Apps Middleware
const mcpMiddleware = new MCPAppsMiddleware({
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001",
  // Filter: only expose tools from connected apps
  filterTools: async (tools, context) => {
    // Get connected apps from client state
    const connectedApps = context.properties?.connectedApps || [];

    return tools.filter((tool) => {
      const resourceUri = tool._meta?.["ui/resourceUri"];
      if (!resourceUri) return true; // Include non-UI tools

      // Extract app ID from resource URI
      const appId = resourceUri.match(/ui:\/\/([^/]+)/)?.[1];
      return appId && connectedApps.includes(appId);
    });
  },
});

runtime.addMiddleware(mcpMiddleware);

const handler = createCopilotEndpoint(runtime);

export const POST = handler.POST;
export const GET = handler.GET;
```

---

## Phase 7: Running the Project

### 7.1 Environment Variables

**File:** `.env.local`

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# MCP Server URL
MCP_SERVER_URL=http://localhost:3001

# Optional: CopilotKit configuration
COPILOTKIT_RUNTIME_URL=/api/copilotkit
```

### 7.2 Development Commands

```bash
# Install all dependencies
bun install
cd mcp-server && bun install && cd ..

# Terminal 1: Start MCP Server
bun run --cwd mcp-server dev

# Terminal 2: Start Next.js Frontend
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

### 7.3 Package.json Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "server:dev": "bun --cwd mcp-server dev"
  }
}
```

---

## Phase 8: Memory Recording System

### 8.1 Library Reference Files

The workflow references two key library files for code examples and structure:

- **`.cline/library/TECH-NOTES.md`** - Detailed MCP patterns, tool registration, bidirectional communication module, and API reference
- **`.cline/library/README.md`** - Project structure, running instructions, and deployment guide

### 8.2 AGENTS.md Structure

**File:** `.clinerules/AGENTS.md`

```markdown
# MCP Apps Library - Agent Memory

## Project Overview

MCP Apps Library with fluid grid UI for pluggable AI applications.

## Key Decisions

- **Connection Model:** Toggle per-app (multiple simultaneous connections)
- **Persistence:** File-based config + localStorage for connections
- **Design:** Glassmorphism aesthetic with fluid grid
- **Runtime:** Bun (not Hono)

## Architecture Patterns

1. App Registry: Hardcoded with extensible structure
2. State Management: Zustand with persistence
3. Communication: MCP protocol over SSE
4. UI: CSS Grid with glassmorphism cards

## Known Issues & Solutions

See findings/ folder for detailed records.

## References

- MCP Spec: https://modelcontextprotocol.io
- CopilotKit: https://copilotkit.ai
- AG-UI: https://github.com/ag-ui-protocol/ag-ui
```

### 8.2 Findings Folder Structure

```
.clinerules/findings/
├── issues/
│   ├── 2024-01-15-cors-error.md
│   └── 2024-01-20-state-persistence.md
├── debugs/
│   ├── 2024-01-15-connection-debug.md
│   └── 2024-01-20-store-hydration.md
└── solutions/
    ├── cors-mcp-server.md
    └── zustand-persist-pattern.md
```

---

## Summary

This workflow creates a complete MCP Apps Library with:

✅ **Fluid grid UI** with responsive glassmorphism cards  
✅ **Toggle connect/disconnect** per app (multi-select)  
✅ **Double-click interaction** for quick toggling  
✅ **File-based configuration** (`mcp-apps.config.json`)  
✅ **Bun runtime** throughout (no Hono)  
✅ **Memory recording** via `AGENTS.md` and findings/ folder

**Next Steps:**

1. Run `bun install` to set up dependencies
2. Copy the MCP server files to `mcp-server/`
3. Create the app HTML files in `mcp-server/apps/`
4. Start both servers with `bun run dev` and `bun run server:dev`
