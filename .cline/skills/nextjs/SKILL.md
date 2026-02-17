---
name: nextjs
description: Next.js 16 App Router patterns for MCP Apps Library with fluid grid UI and glassmorphism design
---

# Next.js Skill - MCP Apps Library

## Overview

Next.js 16 patterns for building the MCP Apps Library with:

- App Router architecture
- Server/Client component patterns
- CopilotKit integration
- Fluid grid layouts
- Glassmorphism design system

---

## Component Architecture

### Server vs Client Components

```typescript
// Server Component (default) - use for data fetching
// File: src/app/page.tsx
import { loadConfig } from "@/lib/config-loader";

export default async function LibraryPage() {
  const config = await loadConfig(); // Server-side only
  return <LibraryGrid config={config} />;
}

// Client Component - use for interactivity
// File: src/components/library/AppCard.tsx
"use client";

import { useConnectionStore } from "@/lib/connection-store";

export function AppCard({ app }: { app: MCPApp }) {
  const { toggleConnection, isConnected } = useConnectionStore();
  // Interactive logic here
}
```

### Component Patterns

#### 1. Library Card Component

```typescript
"use client";

import { useCallback } from "react";
import { MCPApp } from "@/types/mcp-app";

interface AppCardProps {
  app: MCPApp;
  onToggle: (id: string) => void;
  isConnected: boolean;
}

export function AppCard({ app, onToggle, isConnected }: AppCardProps) {
  const handleDoubleClick = useCallback(() => {
    onToggle(app.id);
  }, [app.id, onToggle]);

  return (
    <div
      className={`glass-card ${isConnected ? "active" : ""}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Card content */}
    </div>
  );
}
```

#### 2. Fluid Grid Container

```typescript
// src/components/library/AppGrid.tsx
"use client";

import { MCPApp } from "@/types/mcp-app";
import { AppCard } from "./AppCard";

interface AppGridProps {
  apps: MCPApp[];
}

export function AppGrid({ apps }: AppGridProps) {
  return (
    <div className="app-grid">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
```

**CSS for fluid grid:**

```css
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
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
```

---

## State Management

### Zustand Store Pattern

```typescript
// src/lib/connection-store.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ConnectionState {
  connectedApps: Set<string>;
  toggleConnection: (appId: string) => void;
  disconnectAll: () => void;
  isConnected: (appId: string) => boolean;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connectedApps: new Set(),

      toggleConnection: (appId) => {
        const { connectedApps } = get();
        const newSet = new Set(connectedApps);
        if (newSet.has(appId)) {
          newSet.delete(appId);
        } else {
          newSet.add(appId);
        }
        set({ connectedApps: newSet });
      },

      disconnectAll: () => set({ connectedApps: new Set() }),

      isConnected: (appId) => get().connectedApps.has(appId),
    }),
    {
      name: "mcp-apps-connections",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectedApps: Array.from(state.connectedApps),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.connectedApps = new Set(state.connectedApps);
        }
      },
    },
  ),
);
```

### Hook Patterns

#### useMediaQuery Hook

```typescript
// src/hooks/use-media-query.ts
"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}
```

---

## CopilotKit Integration

### Provider Setup

```typescript
// src/app/layout.tsx
import { CopilotKitProvider } from "@copilotkitnext/react";

export default function RootLayout({ children }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole="auto"
    >
      {children}
    </CopilotKitProvider>
  );
}
```

### Sidebar vs Popup Pattern

```typescript
// src/components/layout/ChatInterface.tsx
"use client";

import { CopilotSidebar, CopilotPopup } from "@copilotkitnext/react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function ChatInterface() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return isDesktop ? (
    <CopilotSidebar defaultOpen={false} width="40%" />
  ) : (
    <CopilotPopup
      defaultOpen={false}
      labels={{
        modalHeaderTitle: "AI Supervisor",
        chatInputPlaceholder: "Ask me anything...",
      }}
    />
  );
}
```

### API Route with MCPAppsMiddleware

```typescript
// src/app/api/copilotkit/route.ts
import { createCopilotEndpoint, CopilotRuntime } from "@copilotkitnext/runtime";
import { MCPAppsMiddleware } from "@ag-ui/mcp-apps-middleware";

const runtime = new CopilotRuntime();

const mcpMiddleware = new MCPAppsMiddleware({
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001",
  filterTools: async (tools, context) => {
    const connectedApps = context.properties?.connectedApps || [];
    return tools.filter((tool) => {
      const uri = tool._meta?.["ui/resourceUri"];
      if (!uri) return true;
      const appId = uri.match(/ui:\/\/([^/]+)/)?.[1];
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

## Styling Patterns

### Glassmorphism Design System

```css
/* src/app/globals.css */
:root {
  --color-bg-primary: #0f0f1a;
  --color-bg-glass: rgba(255, 255, 255, 0.05);
  --color-bg-glass-hover: rgba(255, 255, 255, 0.1);
  --color-lilac: #a78bfa;
  --color-mint: #34d399;
  --color-rose: #fb7185;
}

.glass-card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: var(--color-bg-glass-hover);
  transform: translateY(-4px);
}

.glass-card.active {
  border-color: var(--color-lilac);
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.4);
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.1)",
          active: "rgba(255, 255, 255, 0.15)",
        },
        accent: {
          lilac: "#a78bfa",
          mint: "#34d399",
          rose: "#fb7185",
        },
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Library page (Server Component)
│   ├── layout.tsx            # Root layout with CopilotKitProvider
│   ├── globals.css           # Global styles + glassmorphism
│   └── api/
│       └── copilotkit/
│           └── route.ts      # CopilotKit API with MCPAppsMiddleware
├── components/
│   ├── library/
│   │   ├── AppCard.tsx       # Individual app card (Client)
│   │   ├── AppGrid.tsx       # Grid container (Client)
│   │   └── ConnectionStatus.tsx
│   └── layout/
│       └── ChatInterface.tsx
├── hooks/
│   └── use-media-query.ts
├── lib/
│   ├── apps-registry.ts      # App definitions
│   ├── connection-store.ts   # Zustand store
│   └── config-loader.ts      # File config utilities
└── types/
    └── mcp-app.ts            # TypeScript interfaces
```

---

## Common Patterns

### 1. Icon Component Pattern

```typescript
// src/components/ui/Icon.tsx
const icons = {
  plane: <svg>...</svg>,
  building: <svg>...</svg>,
  // ...
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={className}>{icons[name] || null}</span>;
}
```

### 2. Animated Background Pattern

```typescript
// src/components/layout/AnimatedBackground.tsx
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-float-delayed" />
    </div>
  );
}
```

### 3. Error Boundary Pattern

```typescript
// src/components/error/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## Best Practices

1. **Server Components by default** - Only use "use client" when needed
2. **Colocate state** - Keep Zustand stores close to components that use them
3. **Type safety** - Define interfaces in `src/types/` folder
4. **CSS variables** - Use CSS custom properties for theming
5. **Responsive first** - Mobile-first approach with Tailwind breakpoints
6. **Accessibility** - Include aria-labels, keyboard navigation, focus states
