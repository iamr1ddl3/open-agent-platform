# OpenAgentPlatform (OAP)

**Open-source, local-first desktop AI agent platform that executes tasks, not just chats.**

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/iamr1ddl3/open-agent-platform/blob/main/notebooks/OpenAgentPlatform_Colab.ipynb)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-41+-47848F.svg)](https://www.electronjs.org/)

Inspired by [Accio Work](https://www.accio.com/work/) by Alibaba International, OpenAgentPlatform brings the same powerful agentic capabilities as an open-source, self-hosted Electron desktop application. Create AI agents that can read files, run terminal commands, automate browsers, call APIs, and collaborate as teams — all running locally on your machine.

---

## Why OpenAgentPlatform?

Most AI tools are chat-only. OAP is **execution-oriented** — agents don't just suggest, they *do*. File operations, terminal commands, browser automation, web scraping, and multi-step workflows all run locally on your device with full privacy.

## Key Features

### Multi-Provider LLM Gateway
Connect to **OpenAI** (GPT-4o), **Anthropic** (Claude 3.5), **Google** (Gemini), and **Ollama** (local models) through a unified gateway. Assign different models to different agents. No vendor lock-in.

### Agent Execution Engine
Agents run an agentic loop: receive a task, plan, call tools, observe results, iterate until done. Includes two-tier memory (short-term conversation + long-term persistent facts), configurable system prompts, and iteration limits.

### 40+ Built-in Tools
Organized into five categories:

- **File Tools** — read, write, edit, copy, move, delete, list directories, get file info
- **Terminal Tools** — execute commands, run background processes, manage PIDs
- **Browser Tools** — navigate, click, type, screenshot, evaluate JS, extract text (via Chrome DevTools Protocol)
- **Web Tools** — search, fetch URLs, scrape structured data
- **MCP Tools** — dynamically loaded from any MCP-compatible server

### Model Context Protocol (MCP) Support
Connect to external MCP servers via stdio, SSE, or HTTP transport. Automatically discovers and registers tools from connected servers. Fully compatible with the open MCP standard.

### Skills & Plugin System
Install domain-specific skill packs that extend agent capabilities. Ships with three built-in skills (Code Review, SEO Audit, Copywriting). Create custom skills with JSON manifests, system prompts, and tool handlers. Dependency resolution included.

### Multi-Agent Teams
Create teams with a designated Team Lead who decomposes tasks and delegates to specialized member agents. Three orchestration strategies: **sequential**, **parallel**, and **delegated** (lead decides). Agents communicate via group chat.

### Automation & Scheduling
Schedule tasks using natural language ("every Monday at 9am") or cron expressions. Jobs run locally, persist across restarts, and reconcile missed runs. Full execution logging.

### Channel Integrations
Connect agents to **Telegram**, **Discord**, and **Slack**. Agents can receive messages, process them, and reply automatically. Configurable filters for users, channels, and trigger prefixes.

### Modern Desktop UI
Dark-themed Electron app built with React, TypeScript, and Zustand. Features: chat interface with streaming, agent management, team coordination, automation dashboard, skills marketplace, settings panel.

---

## Architecture

```
open-agent-platform/
├── src/
│   ├── main/                # Electron main process
│   │   ├── index.ts         # App lifecycle, CSP, window creation
│   │   ├── ipc-handlers.ts  # IPC bridge (40+ handlers)
│   │   └── window-manager.ts
│   ├── preload/
│   │   └── index.ts         # Secure context bridge (contextIsolation)
│   ├── renderer/            # React frontend
│   │   ├── App.tsx          # Router with 7 routes
│   │   ├── components/      # 15+ UI components
│   │   ├── hooks/           # useAgent, useChat
│   │   ├── store/           # Zustand state management
│   │   └── styles/          # Dark theme CSS
│   ├── core/                # Agent engine
│   │   ├── agent.ts         # Agent class (config, state, memory)
│   │   ├── agent-runner.ts  # Agentic execution loop
│   │   ├── memory.ts        # Two-tier memory system
│   │   ├── tool-registry.ts # Tool registration & execution
│   │   └── types.ts         # Core type definitions
│   ├── llm/                 # LLM Gateway
│   │   ├── gateway.ts       # Unified multi-provider gateway
│   │   └── providers/       # OpenAI, Anthropic, Google, Ollama
│   ├── tools/               # 40+ built-in tools
│   │   ├── file-tools.ts
│   │   ├── terminal-tools.ts
│   │   ├── browser-tools.ts
│   │   ├── web-tools.ts
│   │   └── index.ts         # Tool registration
│   ├── mcp/                 # MCP Protocol client
│   │   ├── client.ts        # Multi-server management
│   │   └── transport.ts     # Stdio, SSE, HTTP transports
│   ├── skills/              # Plugin system
│   │   ├── skill-loader.ts  # Manifest loading & validation
│   │   └── skill-registry.ts# Install/uninstall/enable
│   ├── teams/               # Multi-agent orchestration
│   │   ├── team-manager.ts  # Team lifecycle & execution
│   │   └── team-lead.ts     # Task decomposition & delegation
│   ├── scheduler/           # Cron-based automation
│   │   ├── scheduler.ts     # Job management & execution
│   │   └── cron-parser.ts   # Natural language → cron
│   └── channels/            # Messaging integrations
│       ├── telegram.ts
│       ├── discord.ts
│       └── slack.ts
├── skills/                  # Built-in skill packs
│   ├── code-review/
│   ├── seo-audit/
│   └── copywriting/
├── package.json
├── tsconfig.json
├── electron-builder.yml
└── vite.config.ts
```

### Data Flow

```
User Input → Renderer (React) → IPC Bridge → Main Process
  → AgentRunner → LLM Gateway → Provider (OpenAI/Anthropic/Google/Ollama)
  → Tool Calls → ToolRegistry → Execute Tool → Results
  → Feed back to LLM → Iterate until done → Stream response to UI
```

### Security Model

- **Context Isolation**: Renderer has no direct Node.js access; all calls go through the preload bridge
- **Content Security Policy**: Restricts script/style/connection sources
- **Tool Approval**: Sensitive tools (browser, terminal) can require explicit user approval
- **Sandboxed Execution**: File tools validate paths to prevent directory traversal
- **Local-First**: All execution happens on-device; only LLM API calls leave the machine

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Ollama installed locally for local model support

### Installation

```bash
# Clone the repository
git clone https://github.com/iamr1ddl3/open-agent-platform.git
cd open-agent-platform

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Configure LLM Providers

Open Settings in the app and add your API keys:

- **OpenAI**: Get a key from [platform.openai.com](https://platform.openai.com)
- **Anthropic**: Get a key from [console.anthropic.com](https://console.anthropic.com)
- **Google**: Get a key from [aistudio.google.com](https://aistudio.google.com)
- **Ollama**: Just install Ollama and pull a model — no key needed

### Create Your First Agent

1. Go to the **Agents** tab
2. Click **Create Agent**
3. Give it a name, pick a provider/model, select tools
4. Start chatting — the agent will use tools to complete your tasks

### Build for Distribution

```bash
# Build for your platform
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

---

## Extending OAP

### Creating a Custom Skill

Create a directory under `skills/` with a `skill.json`:

```json
{
  "id": "my-skill",
  "name": "My Custom Skill",
  "version": "1.0.0",
  "description": "Does something amazing",
  "author": "You",
  "category": "custom",
  "tags": ["custom"],
  "systemPrompt": "You are an expert at doing amazing things...",
  "tools": [
    {
      "name": "my_tool",
      "description": "Does the thing",
      "handler": "tools/my-tool.js",
      "parameters": {
        "type": "object",
        "properties": {
          "input": { "type": "string", "description": "The input" }
        },
        "required": ["input"]
      }
    }
  ]
}
```

### Connecting an MCP Server

1. Go to **Settings → MCP Servers**
2. Add server URL or stdio command
3. Tools from the server appear automatically in the tool registry

### Setting Up a Team

1. Create 2+ agents with different specializations
2. Go to **Teams** tab, create a team
3. Assign a lead agent and member agents
4. Choose a strategy (sequential, parallel, or delegated)
5. Give the team a task and watch them collaborate

---

## Comparison with Accio Work

| Feature | Accio Work | OpenAgentPlatform |
|---------|-----------|-------------------|
| Local-first execution | Yes | Yes |
| Multi-LLM support | Gemini, GPT-4o, Claude, Qwen | OpenAI, Anthropic, Google, Ollama |
| Browser automation | CDP-based | CDP via Puppeteer Core |
| File & terminal access | Yes | Yes |
| Multi-agent teams | Yes | Yes (3 strategies) |
| MCP support | Yes | Yes (stdio, SSE, HTTP) |
| Skills/plugins | Yes (marketplace) | Yes (local + extensible) |
| Scheduling | Yes | Yes (cron + natural language) |
| Channel integrations | Telegram, Discord, DingTalk, Lark, WeChat | Telegram, Discord, Slack |
| Open source | No | **Yes (MIT License)** |
| Self-hosted | Desktop only | Desktop + fully self-hosted |
| Platform | macOS, Windows | macOS, Windows, Linux |

---

## Tech Stack

- **Desktop Framework**: Electron 41+
- **Language**: TypeScript 5.6+ (strict mode)
- **Frontend**: React 19, React Router 6, Zustand 5
- **Build**: Vite 5, electron-builder 25
- **LLM SDKs**: openai, @anthropic-ai/sdk, @google/generative-ai
- **Browser Automation**: puppeteer-core (Chrome DevTools Protocol)
- **Scheduling**: node-cron
- **Channels**: telegraf, discord.js, @slack/web-api
- **MCP**: @modelcontextprotocol/sdk

---

## Contributing

We welcome contributions! Areas where help is especially appreciated:

- Additional LLM provider implementations (Mistral, Cohere, etc.)
- More built-in skills
- DingTalk and WeChat channel integrations
- UI/UX improvements
- Documentation and tutorials
- Testing and bug fixes

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with the open-source community in mind. If Accio Work showed what's possible, OpenAgentPlatform makes it accessible to everyone.
