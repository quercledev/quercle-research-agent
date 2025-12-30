# Quercle Research Agent

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Quercle](https://img.shields.io/badge/Quercle-2563EB?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDNhOSA5IDAgMSAwIDkgOSIvPjxwYXRoIGQ9Ik0xMiAzdjkiLz48cGF0aCBkPSJNMTIgMTJsNi42LTYuNiIvPjwvc3ZnPg==&logoColor=white)](https://quercle.dev)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An AI-powered research agent with **persistent memory**. Uses [Quercle](https://quercle.dev) for real-time web intelligence and [MongoDB](https://mongodb.com) for long-term memory storage.

```
You: Research the current state of AI agent frameworks

Agent: [web_search] "AI agent frameworks 2025"
       [read_page] Analyzing langchain documentation...
       [remember] Storing 5 key findings...

       Here's what I found: ...

You (next week): What did you find about LangChain?

Agent: [recall] Retrieving memories about "LangChain"...

       From my previous research, LangChain is...
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent                               │
│              (Claude, GPT-4, or other LLMs)                 │
│                   via Vercel AI SDK                         │
└──────────┬──────────────┬──────────────┬────────────────────┘
           │              │              │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
     │web_search │  │ read_page │  │  memory   │
     └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
           │              │              │
     ┌─────▼──────────────▼─────┐  ┌─────▼─────┐
     │        Quercle API       │  │  MongoDB  │
     │  Real-time web intel     │  │  Atlas    │
     └──────────────────────────┘  └───────────┘
```

### Why This Stack?

| Component | Role | Why It's Essential |
|-----------|------|-------------------|
| **Quercle** | Real-time web access | AI-processed web content, not raw HTML. Every query returns clean, analyzed data. |
| **MongoDB** | Persistent memory | Flexible document model fits varied research findings. No rigid schema needed. |
| **Vercel AI SDK** | LLM orchestration | Unified interface for any LLM provider with built-in streaming and tool support. |

## Features

### Core Research
- **Autonomous Research** - Enter a complex question, watch the agent break it down and investigate
- **Real-time Progress** - See the agent's thinking process in a live timeline
- **Comprehensive Reports** - Get well-structured markdown reports with inline citations
- **Source Tracking** - All sources are tracked and cited in the final report

### Persistent Memory (MongoDB)
- **Remember Facts** - Agent stores key findings, sources, and insights
- **Recall Across Sessions** - Query past research by topic or semantic search
- **Session Management** - Organize research into topics and sessions
- **Knowledge Building** - Agent builds understanding over time, not just one-shot queries

## How It Works

1. **Research Phase** - Agent searches and fetches web content using Quercle
2. **Memory Phase** - Key findings are stored in MongoDB with metadata
3. **Recall Phase** - On future queries, agent checks memory before searching again
4. **Synthesis Phase** - Combines new findings with remembered context

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime
- [Quercle API key](https://quercle.dev) (free tier available)
- [MongoDB Atlas](https://mongodb.com/atlas) connection string (free tier available)
- OpenRouter or OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/quercle/quercle-research-agent.git
cd quercle-research-agent

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Run the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

Edit `.env` with your credentials:

```bash
# Required: Quercle API
QUERCLE_API_KEY=qk_...

# Required: MongoDB Atlas
MONGODB_URI=mongodb+srv://...

# Required: LLM Provider (via OpenRouter)
OPENROUTER_API_KEY=sk-or-...

# Optional: Default model
DEFAULT_MODEL=anthropic/claude-sonnet-4
```

## Agent Tools

The agent has access to four tools:

### `quercleSearch`

Search the web for information on any topic.

```typescript
quercleSearch({ query: "latest developments in quantum computing" })
// Returns AI-synthesized results from multiple sources
```

### `quercleFetch`

Analyze a specific webpage with a custom prompt.

```typescript
quercleFetch({
  url: "https://example.com/article",
  prompt: "Extract the main arguments and statistics"
})
```

### `remember`

Store facts and findings in long-term memory.

```typescript
remember({
  topic: "quantum-computing",
  facts: [
    { content: "IBM unveiled a 1000+ qubit processor", source: "ibm.com" },
    { content: "Error correction remains the main challenge", source: "nature.com" }
  ]
})
```

### `recall`

Retrieve past research from memory.

```typescript
recall({
  topic: "quantum-computing",
  query: "error correction"  // optional semantic search
})
```

## MongoDB Schema

Research memories are stored as flexible documents:

```typescript
interface ResearchMemory {
  _id: ObjectId;
  sessionId: string;
  topic: string;
  question: string;
  facts: Array<{
    content: string;
    source: string;
    confidence: "high" | "medium" | "low";
    createdAt: Date;
  }>;
  sourcesVisited: string[];
  report?: string;
  metadata: {
    model: string;
    totalSteps: number;
    duration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Why MongoDB for Agent Memory?

1. **Flexible Schema** - Research findings vary wildly. Some have citations, images, structured data. MongoDB handles this naturally.

2. **Rich Queries** - Find memories by topic, date range, source domain, or full-text search.

3. **Atlas Search** - Semantic recall finds conceptually related memories, not just keyword matches.

4. **Aggregation Pipeline** - Analyze patterns: most-visited domains, topics over time, knowledge gaps.

5. **Horizontal Scaling** - As agent memory grows, MongoDB scales seamlessly.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun
- **AI SDK**: Vercel AI SDK
- **Web Intelligence**: Quercle API
- **Memory**: MongoDB Atlas

## Project Structure

```
quercle-research-agent/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── page.tsx           # Main research UI
├── components/
│   ├── ui/                # Base UI components
│   └── research/          # Research-specific components
├── lib/
│   ├── agent/             # Agent core logic
│   │   ├── research-agent.ts
│   │   ├── types.ts
│   │   └── tools/         # Agent tools
│   │       ├── remember.ts
│   │       └── recall.ts
│   ├── memory/            # MongoDB integration
│   │   ├── client.ts
│   │   ├── schemas.ts
│   │   └── operations.ts
│   ├── hooks/             # React hooks
│   └── quercle-client.ts  # Quercle API client
└── types/                  # TypeScript declarations
```

## Development

```bash
# Run in development mode
bun dev

# Build for production
bun run build

# Start production server
bun start

# Lint
bun run lint
```

## Example Session

```
Research Agent v1.0.0

You: What are the best practices for building AI agents in 2025?

Agent: Let me check if I have any relevant memories...
       [recall] No previous research on AI agents found.

       Starting fresh research...
       [web_search] "AI agent best practices 2025"
       [read_page] Analyzing anthropic.com/research/building-effective-agents
       [web_search] "AI agent patterns ReAct chain-of-thought"
       [remember] Stored 8 key findings about AI agent best practices

       Based on my research, here are the best practices:

       1. **Use structured tool definitions** [1]
          - Clear schemas help LLMs understand available actions
          - Source: anthropic.com

       2. **Implement proper error handling** [2]
          - Agents should gracefully handle tool failures
          - Source: langchain.com
       ...

You (later): What did Anthropic say about agent design?

Agent: [recall] Found 3 memories about Anthropic's agent research...

       From my previous research, Anthropic recommends:
       - Keeping tools simple and focused
       - Using explicit reasoning steps
       - Providing clear success/failure signals
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Quercle](https://quercle.dev) - AI-powered web fetching and search API
- [MongoDB](https://mongodb.com) - Document database for agent memory
- [Vercel AI SDK](https://sdk.vercel.ai) - AI toolkit for TypeScript

---

**Built with Quercle + MongoDB** - Real-time web intelligence meets persistent memory
