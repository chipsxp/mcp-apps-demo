---
name: mcp-apps
description: MCP Apps Extension patterns for pluggable AI apps with dynamic tool registration and bidirectional iframe communication
---

# MCP Apps Skill - Dynamic App Loading

## Overview

MCP Apps Extension (SEP-1865) patterns for building pluggable AI applications:

- Dynamic tool registration based on connected apps
- Bidirectional iframe communication
- Resource serving with `text/html+mcp` mime type
- Tool-to-UI linking via `_meta["ui/resourceUri"]`

---

## Core Concepts

### MCP Apps Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Query                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CopilotKit Runtime                            │
│              (BasicAgent + MCPAppsMiddleware)                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              filterTools() Middleware                    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ connectedApps = ['flights', 'trading']         │    │    │
│  │  │                                                  │    │    │
│  │  │ Tool: search-flights ✓ (ui://flights/...)      │    │    │
│  │  │ Tool: search-hotels  ✗ (not connected)         │    │    │
│  │  │ Tool: execute-trade  ✓ (ui://trading/...)      │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Bun)                              │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │   Tool Calls    │  │           Resources                  │   │
│  │ ─────────────── │  │ ───────────────────────────────────  │   │
│  │ search-flights  │  │ ui://flights/flights-app.html       │   │
│  │ execute-trade   │  │   ↓ text/html+mcp                    │   │
│  │                 │  │   ↓ Served to iframe                 │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP App (iframe)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              postMessage ↔ JSON-RPC                      │    │
│  │                                                          │    │
│  │  UI Event ──▶ tools/call ──▶ MCP Server                 │    │
│  │     ▲                             │                     │    │
│  │     └──── tool-result ────────────┘                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Registration with UI Resources

### Tool Definition Pattern

```typescript
// mcp-server/server.ts
const RESOURCE_URI_META_KEY = "ui/resourceUri";

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  _meta?: {
    [RESOURCE_URI_META_KEY]?: string;
  };
}

const tools: ToolDefinition[] = [
  {
    name: "search-flights",
    description: "Search for available flights between airports",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "Origin airport code (e.g., JFK)",
        },
        destination: {
          type: "string",
          description: "Destination airport code",
        },
        departureDate: { type: "string", format: "date" },
        passengers: { type: "number", minimum: 1, maximum: 9 },
      },
      required: ["origin", "destination", "departureDate"],
    },
    _meta: {
      [RESOURCE_URI_META_KEY]: "ui://flights/flights-app.html",
    },
  },
  {
    name: "execute-trade",
    description: "Execute a buy or sell trade",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        action: { enum: ["buy", "sell"] },
        quantity: { type: "number", minimum: 1 },
      },
      required: ["symbol", "action", "quantity"],
    },
    _meta: {
      [RESOURCE_URI_META_KEY]: "ui://trading/trading-app.html",
    },
  },
];
```

### Dynamic Tool Filtering

```typescript
// src/app/api/copilotkit/route.ts
import { MCPAppsMiddleware } from "@ag-ui/mcp-apps-middleware";

const mcpMiddleware = new MCPAppsMiddleware({
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001",

  // Filter tools based on connected apps
  filterTools: async (tools, context) => {
    // Get connected apps from request context
    const connectedApps: string[] = context.properties?.connectedApps || [];

    return tools.filter((tool) => {
      const resourceUri = tool._meta?.["ui/resourceUri"];

      // Tools without UI resources are always available
      if (!resourceUri) return true;

      // Extract app ID from URI: ui://{appId}/path
      const match = resourceUri.match(/ui:\/\/([^/]+)/);
      const appId = match?.[1];

      // Only include if app is connected
      return appId && connectedApps.includes(appId);
    });
  },

  // Include connected apps in context
  transformContext: async (context) => {
    return {
      ...context,
      properties: {
        ...context.properties,
        connectedApps: await getUserConnectedApps(), // From your store
      },
    };
  },
});
```

---

## Resource Serving

### Resource Registration

```typescript
// mcp-server/server.ts
import { readFileSync } from "fs";
import { join } from "path";

interface ResourceDefinition {
  uri: string;
  mimeType: string;
  name: string;
}

const resources: ResourceDefinition[] = [
  {
    uri: "ui://flights/flights-app.html",
    mimeType: "text/html+mcp",
    name: "Flights Booking App",
  },
  {
    uri: "ui://hotels/hotels-app.html",
    mimeType: "text/html+mcp",
    name: "Hotel Booking App",
  },
  {
    uri: "ui://trading/trading-app.html",
    mimeType: "text/html+mcp",
    name: "Trading Simulator App",
  },
  {
    uri: "ui://kanban/kanban-app.html",
    mimeType: "text/html+mcp",
    name: "Kanban Board App",
  },
];

// Register resource handlers
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith("ui://")) {
    // Load from filesystem
    const relativePath = uri.replace("ui://", "");
    const filePath = join(process.cwd(), "apps", relativePath);
    const content = readFileSync(filePath, "utf-8");

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
```

---

## Bidirectional Communication

### MCP App Communication Module

**Pattern used in all MCP Apps (iframe side):**

```javascript
// mcp-server/apps/shared/mcp-communication.js

/**
 * MCP App Communication Module
 * Handles JSON-RPC over postMessage between iframe and parent
 */
const MCPApp = (() => {
  let requestId = 1;
  const pendingRequests = new Map();
  const notificationHandlers = new Map();

  // Initialize communication
  function init() {
    window.addEventListener("message", handleMessage);

    // Notify parent that app is ready
    sendNotification("ui/ready", {});
  }

  // Handle incoming messages
  function handleMessage(event) {
    const { data } = event;

    // Validate JSON-RPC
    if (data.jsonrpc !== "2.0") return;

    // Handle responses
    if (data.id !== undefined && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);

      if (data.error) {
        reject(data.error);
      } else {
        resolve(data.result);
      }
    }

    // Handle notifications
    if (data.id === undefined && data.method) {
      const handler = notificationHandlers.get(data.method);
      if (handler) {
        handler(data.params);
      }
    }
  }

  // Send request and wait for response
  function sendRequest(method, params) {
    const id = requestId++;

    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });

      window.parent.postMessage(
        {
          jsonrpc: "2.0",
          id,
          method,
          params,
        },
        "*",
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  // Send notification (no response expected)
  function sendNotification(method, params) {
    window.parent.postMessage(
      {
        jsonrpc: "2.0",
        method,
        params,
      },
      "*",
    );
  }

  // Register notification handler
  function onNotification(method, handler) {
    notificationHandlers.set(method, handler);
  }

  // Public API
  return {
    init,
    sendRequest,
    sendNotification,
    onNotification,
  };
})();

// Export for use in apps
window.MCPApp = MCPApp;
```

### Tool Calls from MCP App

```javascript
// Example: Calling a tool from the Flights app
async function searchFlights(origin, destination, date) {
  try {
    const result = await MCPApp.sendRequest("tools/call", {
      name: "search-flights",
      arguments: {
        origin,
        destination,
        departureDate: date,
        passengers: 1,
      },
    });

    // Handle result
    const flights = JSON.parse(result.content[0].text);
    renderFlights(flights);
  } catch (error) {
    console.error("Failed to search flights:", error);
    showError(error.message);
  }
}

// Listen for tool results (from AI-initiated calls)
MCPApp.onNotification("ui/notifications/tool-result", (params) => {
  const { toolName, structuredContent } = params;

  if (toolName === "search-flights") {
    updateFlightResults(structuredContent);
  }
});
```

---

## App Registry Pattern

### Hardcoded Registry with Config Overlay

```typescript
// src/lib/apps-registry.ts
import { MCPApp, ToolDefinition } from "@/types/mcp-app";

export const appsRegistry: MCPApp[] = [
  {
    id: "flights",
    name: "Airline Booking",
    description: "Search flights, select seats, complete bookings",
    icon: "plane",
    category: "travel",
    resourceUri: "ui://flights/flights-app.html",
    tools: [
      {
        name: "search-flights",
        description: "Search available flights",
        inputSchema: z.object({
          origin: z.string(),
          destination: z.string(),
          departureDate: z.string(),
          passengers: z.number().min(1).max(9),
        }),
        meta: { "ui/resourceUri": "ui://flights/flights-app.html" },
      },
      {
        name: "select-seat",
        description: "Select seat for a flight",
        inputSchema: z.object({
          flightId: z.string(),
          seatNumber: z.string(),
        }),
        meta: { "ui/resourceUri": "ui://flights/flights-app.html" },
      },
    ],
    config: {
      enabled: true,
      defaultOpen: false,
    },
  },
  // ... more apps
];

// Get tools for connected apps only
export function getToolsForApps(appIds: string[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  for (const appId of appIds) {
    const app = appsRegistry.find((a) => a.id === appId);
    if (app?.config.enabled !== false) {
      tools.push(...app.tools);
    }
  }

  return tools;
}

// Get connected app resources
export function getResourcesForApps(appIds: string[]) {
  return appIds
    .map((id) => appsRegistry.find((a) => a.id === id))
    .filter((app): app is MCPApp => !!app && app.config.enabled !== false)
    .map((app) => ({
      uri: app.resourceUri,
      mimeType: "text/html+mcp",
      name: app.name,
    }));
}
```

---

## Supervisor LLM Integration

### Multi-App Orchestration

```typescript
// Example: User query handling with multiple connected apps

// User: "Book a flight to Paris and find a hotel"
// Connected apps: ['flights', 'hotels']

// AI processes:
// 1. Detects intent: flight booking + hotel booking
// 2. Calls search-flights tool (from flights app)
// 3. MCPAppsMiddleware serves flights-app.html
// 4. User selects flight in UI
// 5. AI calls search-hotels tool (from hotels app)
// 6. MCPAppsMiddleware serves hotels-app.html
// 7. User completes booking in both UIs

// The supervisor coordinates across multiple apps
// by having access to tools from all connected apps
```

### Connection State Sync

```typescript
// src/lib/connection-sync.ts
import { useConnectionStore } from "./connection-store";

// Sync connected apps to CopilotKit context
export function useSyncConnections() {
  const { connectedApps } = useConnectionStore();
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    // Update CopilotKit context with connected apps
    copilotkit.setContext({
      connectedApps: Array.from(connectedApps),
    });
  }, [connectedApps, copilotkit]);
}
```

---

## MCP App HTML Structure

### Self-Contained App Template

```html
<!-- mcp-server/apps/flights-app.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flights Booking</title>
    <style>
      /* Inline styles - no external CDN (sandbox restriction) */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: system-ui, sans-serif;
        background: #0f0f1a;
        color: #f8fafc;
        padding: 16px;
      }
      .flight-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .flight-card:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      /* ... more styles ... */
    </style>
  </head>
  <body>
    <div id="app">
      <h1>Flight Search Results</h1>
      <div id="flights-list"></div>
    </div>

    <!-- MCP Communication Module -->
    <script>
      // Include the MCPApp module (inline)
      const MCPApp = (() => {
        // ... module code from above ...
      })();

      // App logic
      const app = {
        flights: [],

        init() {
          MCPApp.init();
          MCPApp.onNotification(
            "ui/notifications/tool-result",
            this.handleToolResult.bind(this),
          );
          this.loadFlights();
        },

        async loadFlights() {
          // Get search params from URL or state
          const params = new URLSearchParams(window.location.search);
          const origin = params.get("origin");
          const destination = params.get("destination");

          if (origin && destination) {
            const result = await MCPApp.sendRequest("tools/call", {
              name: "search-flights",
              arguments: { origin, destination, passengers: 1 },
            });
            this.renderFlights(JSON.parse(result.content[0].text));
          }
        },

        renderFlights(flights) {
          const container = document.getElementById("flights-list");
          container.innerHTML = flights
            .map(
              (f) => `
          <div class="flight-card" onclick="app.selectFlight('${f.id}')">
            <div>${f.airline} - Flight ${f.number}</div>
            <div>${f.departure} → ${f.arrival}</div>
            <div>$${f.price}</div>
          </div>
        `,
            )
            .join("");
        },

        async selectFlight(flightId) {
          await MCPApp.sendRequest("tools/call", {
            name: "select-flight",
            arguments: { flightId },
          });
        },

        handleToolResult(params) {
          if (params.toolName === "search-flights") {
            this.renderFlights(params.structuredContent);
          }
        },
      };

      // Initialize
      app.init();
    </script>
  </body>
</html>
```

---

## Best Practices

### 1. Tool Naming

```typescript
// Use namespaced tool names to avoid conflicts
// Good:
"flights:search";
"flights:select-seat";
"hotels:search";
"trading:execute-trade";

// Avoid:
"search"; // Too generic
"execute"; // Ambiguous
```

### 2. Resource URI Convention

```typescript
// Consistent URI scheme
"ui://{appId}/{component}.html";

// Examples:
"ui://flights/flights-app.html";
"ui://flights/seat-picker.html"; // Secondary component
"ui://trading/trading-app.html";
"ui://trading/portfolio-chart.html"; // Secondary component
```

### 3. Error Handling

```typescript
// MCP App error handling
async function safeToolCall(name, args) {
  try {
    return await MCPApp.sendRequest("tools/call", { name, arguments: args });
  } catch (error) {
    // Show user-friendly error in UI
    showErrorToast(error.message);

    // Log for debugging
    console.error(`Tool call failed: ${name}`, error);

    // Re-throw if needed
    throw error;
  }
}
```

### 4. State Management

```typescript
// Keep MCP App state minimal
// Most state should be managed by the MCP server

// Good: UI-only state
interface UIState {
  selectedFlightId: string | null;
  currentView: "search" | "results" | "booking";
  isLoading: boolean;
}

// Bad: Duplicating server state
interface BadState {
  flights: Flight[]; // Get from server
  userPreferences: object; // Get from server
  bookingHistory: object[]; // Get from server
}
```

### 5. Security

```typescript
// Validate all inputs
const searchSchema = z.object({
  origin: z.string().length(3).toUpperCase(), // IATA code
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengers: z.number().int().min(1).max(9),
});

// Sanitize outputs for HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```

---

## Debugging

### MCP Server Logs

```typescript
// Add logging middleware
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log(`[MCP] Tool call: ${request.params.name}`);
  console.log(`[MCP] Arguments:`, request.params.arguments);

  const result = await executeTool(
    request.params.name,
    request.params.arguments,
  );

  console.log(`[MCP] Result:`, result);
  return result;
});
```

### Browser DevTools

```javascript
// In MCP App console
// Monitor all postMessage traffic
window.addEventListener("message", (e) => {
  console.log("[MCP App] Message received:", e.data);
});

// Test tool calls manually
MCPApp.sendRequest("tools/call", {
  name: "search-flights",
  arguments: { origin: "JFK", destination: "LAX", departureDate: "2024-02-01" },
}).then(console.log);
```
