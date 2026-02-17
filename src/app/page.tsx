"use client";

import {
  CopilotKitProvider,
  CopilotSidebar,
  useAgent,
  useCopilotKit,
  useCopilotChatConfiguration,
} from "@copilotkitnext/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { randomUUID, DEFAULT_AGENT_ID } from "@copilotkitnext/shared";
import { useCallback } from "react";

// Lucide-style SVG icons (inline for reliability)
const Icons = {
  plane: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  ),
  building: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  ),
  trendingUp: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  layoutGrid: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  sparkles: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  ),
};

const apps = [
  {
    id: "flights",
    name: "Airline Booking",
    description:
      "Search flights, select seats, and complete bookings with a full wizard experience",
    icon: Icons.plane,
    iconClass: "flights",
    prompts: [
      "Book a flight from New York to Los Angeles on January 20th for 2 passengers",
      "Find flights from London to Paris next week",
    ],
  },
  {
    id: "hotels",
    name: "Hotel Booking",
    description:
      "Browse hotels, compare rooms, and book accommodations in cities worldwide",
    icon: Icons.building,
    iconClass: "hotels",
    prompts: [
      "Find a hotel in Paris from January 15 to 18 for 2 guests",
      "Search for hotels in Tokyo for 3 nights",
    ],
  },
  {
    id: "trading",
    name: "Investment Simulator",
    description:
      "Build portfolios, execute trades, and track performance with live charts",
    icon: Icons.trendingUp,
    iconClass: "trading",
    prompts: [
      "Create a $10,000 tech-focused portfolio",
      "Build a conservative dividend portfolio",
    ],
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description:
      "Manage projects with drag-drop cards, columns, and task tracking",
    icon: Icons.layoutGrid,
    iconClass: "kanban",
    prompts: [
      "Create a kanban board for my software project",
      "Set up a marketing campaign board",
    ],
  },
];

export default function MCPAppsDemo() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <AppLayout />
    </CopilotKitProvider>
  );
}

function AppLayout() {
  const { agent } = useAgent({ agentId: DEFAULT_AGENT_ID });
  const { copilotkit } = useCopilotKit();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const config = useCopilotChatConfiguration();

  // Send a message to the chat and run the agent
  const sendMessage = useCallback(
    async (message: string) => {
      config?.setModalOpen(true);
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: message,
      });
      try {
        await copilotkit.runAgent({ agent });
      } catch (error) {
        console.error("Failed to run agent:", error);
      }
    },
    [agent, copilotkit, config],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Main Content - 2/3 width */}
      <div className="w-2/3 h-full overflow-auto relative">
        <div className="abstract-bg">
          <div className="blob-3" />
        </div>
        <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 glass-subtle px-4 py-2 rounded-full text-sm text-[var(--color-text-secondary)]">
              {Icons.sparkles}
              <span>MCP Apps Demo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Interactive AI Apps
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-[var(--color-text-secondary)]">
              Rich UI components powered by MCP Apps Extension (SEP-1865)
            </p>
          </section>
          <section className="grid gap-6 md:grid-cols-2">
            {apps.map((app) => (
              <div key={app.id} className="app-card">
                <div className={`app-card-icon ${app.iconClass}`}>
                  {app.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {app.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {app.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {app.prompts.map((prompt, i) => (
                    <button
                      key={i}
                      className="prompt-pill text-xs cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => sendMessage(prompt)}
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
      {/* CopilotKit Chat - Always visible on desktop */}
      <div className="w-1/3 h-full">
        <CopilotChatContainer />
      </div>
    </div>
  );
}

function CopilotChatContainer() {
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "33.333333%",
        zIndex: 50,
      }}
    >
      <CopilotSidebar defaultOpen={true} />
    </div>
  );
}
