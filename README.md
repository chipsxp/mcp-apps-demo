# MCP Apps Demo - Interactive AI Apps

![MCP Apps Demo](https://img.shields.io/badge/Status-Active-success) ![CopilotKit](https://img.shields.io/badge/Powered%20by-CopilotKit-blue) ![MCP](https://img.shields.io/badge/Protocol-MCP-purple)

Welcome to the **MCP Apps Demo**! This project showcases the power of the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/ext-apps) Apps Extension (SEP-1865) integrated with [CopilotKit](https://copilotkit.ai). It demonstrates how AI agents can render rich, interactive, and bidirectional user interfaces directly inside a chat sidebar.

## 🌟 Featured Applications

This repository includes four fully functional, interactive applications that the AI can summon on demand:

| App                         | Description                                                                   | Example Prompt                                                     |
| --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **✈️ Airline Booking**      | A 5-step wizard to search flights, select seats, and enter passenger details. | _"Book a flight from JFK to LAX on January 20th for 2 passengers"_ |
| **🏨 Hotel Booking**        | A 4-step wizard to search hotels, compare rooms, and book accommodations.     | _"Find a hotel in Paris from January 15 to 18 for 2 guests"_       |
| **📈 Investment Simulator** | Portfolio management with live charts and buy/sell trade execution.           | _"Create a $10,000 tech-focused portfolio"_                        |
| **📋 Kanban Board**         | Drag-and-drop task management with customizable columns and cards.            | _"Create a kanban board for my software project"_                  |

## 🏗️ Architecture & How It Works

MCP Apps are interactive HTML/JS applications that render in sandboxed `iframes` within the chat interface. They communicate bidirectionally with the MCP server via JSON-RPC over `postMessage`.

1. **User Request**: The user asks the AI to perform a task (e.g., "Book a flight").
2. **Tool Invocation**: The AI calls the corresponding MCP tool (e.g., `search-flights`).
3. **Middleware Interception**: The `MCPAppsMiddleware` intercepts the tool call and fetches the associated HTML UI resource.
4. **UI Rendering**: CopilotKit renders the interactive app (e.g., `flights-app.html`) inside an iframe in the chat.
5. **Bidirectional Communication**: As the user interacts with the UI (e.g., selecting a seat), the UI sends messages back to the MCP server to execute further tools and update the state.

## 🎨 Design System

The frontend features a custom **Glassmorphism** design system built with Tailwind CSS and custom CSS variables. It includes:

- Abstract animated gradient backgrounds.
- Frosted glass cards (`.glass-card`, `.glass-subtle`) with backdrop blurs.
- Gradient text and borders for a modern, polished look.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (v18+)
- An OpenAI API Key (for the CopilotKit agent)

### 2. Install Dependencies

Install dependencies for both the Next.js frontend and the MCP server:

```bash
# Install frontend dependencies
npm install

# Install MCP server dependencies
cd mcp-server
npm install
cd ..
```

### 3. Set Environment Variables

Create a `.env.local` file in the root directory and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Build & Run

You will need two terminal windows to run both the frontend and the backend simultaneously.

**Terminal 1: Start the MCP Server**

```bash
cd mcp-server
npm run build
npm run dev
# The MCP server will run at http://localhost:3001/mcp
```

**Terminal 2: Start the Next.js Frontend**

```bash
# From the root directory
npm run dev
# The frontend will run at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser and try one of the example prompts!

## 📁 Project Structure

```text
mcp-apps-demo/
├── src/app/
│   ├── page.tsx                    # Main Next.js demo page
│   ├── globals.css                 # Glassmorphism design system
│   └── api/copilotkit/route.ts     # CopilotKit + MCPAppsMiddleware setup
├── mcp-server/
│   ├── server.ts                   # MCP server registering tools & resources
│   ├── src/                        # Backend logic (flights, hotels, stocks, kanban)
│   └── apps/                       # Interactive UI source files (HTML/JS/CSS)
└── README.md                       # This file
```

## 🛠️ Key Technologies

- **[CopilotKit](https://copilotkit.ai)** (`@copilotkitnext/*`): AI chat interface with MCP Apps support.
- **AG-UI MCP Apps Middleware**: Bridges MCP servers with CopilotKit.
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io)** (`@modelcontextprotocol/sdk`): Standardized protocol for connecting AI models to data sources and tools.
- **Next.js & Tailwind CSS**: Frontend framework and styling.
- **Vite**: Bundles each MCP app into a single, self-contained HTML file.

## 📄 License

This project is licensed under the MIT License.
