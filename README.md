# Quercle Research Agent

An AI research assistant that **remembers what it learns**. Built for individuals who research the same topics repeatedly and want to build knowledge over time, not start from scratch each session.

![Research Agent Screenshot](docs/images/research-agent-screenshot.png)

## The Problem

You're researching AI agent frameworks. You spend 30 minutes with ChatGPT, get great results, close the tab. Next week you need to continue that research - but the AI has forgotten everything. You start over.

This agent doesn't forget.

```
Monday:    "Research the current state of AI agent frameworks"
           Agent searches, analyzes 12 sources, stores key findings

Friday:    "What did you find about LangChain vs CrewAI?"
           Agent recalls from memory - no new search needed

Next month: "Update me on AI agents - what's new since my last research?"
            Agent checks memory, searches only for new developments
```

## Who Is This For?

**Individual researchers, analysts, and curious minds** who:

- Track evolving topics over weeks/months (AI news, market trends, tech developments)
- Return to the same domains repeatedly and hate re-explaining context
- Want to see exactly what sources the AI used
- Prefer building cumulative knowledge over one-shot answers

**This is NOT for:**

- One-off questions (just use ChatGPT/Claude/Perplexity)
- Team collaboration (no multi-user support yet)
- Real-time data needs (memory is point-in-time snapshots)

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Question                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  1. Check Memory First │  ← Do I already know this?
              └────────────┬───────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
   ┌─────────────────┐          ┌─────────────────┐
   │ Memory has info │          │ Need fresh data │
   │ Return + update │          │ Search the web  │
   └─────────────────┘          └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Store findings  │
                                │ in memory       │
                                └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Return answer   │
                                │ with citations  │
                                └─────────────────┘
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime
- [Quercle API key](https://quercle.dev) - for web search (free tier available)
- [MongoDB Atlas](https://mongodb.com/atlas) - for memory storage (free tier available)
- [OpenRouter API key](https://openrouter.ai) - for LLM access

### Setup

```bash
git clone https://github.com/quercledev/quercle-research-agent.git
cd quercle-research-agent
bun install
cp .env.example .env
# Edit .env with your API keys
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### Configuration

```bash
# .env
QUERCLE_API_KEY=qk_...           # Web search
MONGODB_URI=mongodb+srv://...     # Memory storage
OPENROUTER_API_KEY=sk-or-...      # LLM provider
MODEL=openai/gpt-5-nano           # Or any OpenRouter model
```

## Features

### Research Flow
- Enter a question, watch the agent work in real-time
- See each step: searches, page reads, memory operations
- Get a structured report with source citations

### Persistent Memory
- Agent stores key findings after each research session
- Recalls relevant memories before searching again
- View and manage research history in the sidebar

### What the Agent Can Do

| Tool | Purpose |
|------|---------|
| `quercleSearch` | Search the web, get AI-synthesized results |
| `quercleFetch` | Read and analyze a specific webpage |
| `remember` | Store facts in long-term memory |
| `recall` | Retrieve past research |

## Example: Building Knowledge Over Time

**Session 1: Initial Research**
```
You: What are the main approaches to AI agent memory?

Agent: [recall] No previous research found
       [search] "AI agent memory architectures 2025"
       [fetch] langchain.com/docs/memory
       [remember] Stored 6 findings about agent memory

Report: There are three main approaches...
        1. Buffer memory (recent context)
        2. Vector memory (semantic search)
        3. Entity memory (knowledge graphs)
```

**Session 2: Follow-up (days later)**
```
You: How does LangChain implement vector memory?

Agent: [recall] Found 2 memories about LangChain memory...
       [search] "LangChain vector memory implementation" (for details)
       [remember] Updated findings with implementation specifics

Report: Based on my previous research and new findings...
```

**Session 3: Checking for updates**
```
You: Any new developments in AI agent memory since my last research?

Agent: [recall] Last researched: 2 weeks ago
       [search] "AI agent memory" (filtered to last 2 weeks)

Report: Since your last research, two notable developments...
```

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Framework | Next.js 16 | App router, server components |
| Runtime | Bun | Fast, modern |
| Web Search | Quercle API | Returns analyzed content, not raw HTML |
| Memory | MongoDB Atlas | Flexible schema for varied research data |
| LLM | OpenRouter | Access to multiple models |
| AI SDK | Vercel AI SDK | Streaming, tool calling |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── research/      # Main research endpoint
│   │   └── history/       # Research history CRUD
│   └── page.tsx           # Main UI
├── components/
│   ├── ResearchInput.tsx  # Question input
│   ├── AgentTimeline.tsx  # Step-by-step progress
│   ├── ReportPanel.tsx    # Final report display
│   └── HistorySidebar.tsx # Research history
├── lib/
│   ├── agent/             # Types and utilities
│   ├── memory/            # MongoDB operations
│   └── hooks/             # React hooks
```

## Limitations

- **Single user** - No authentication or multi-user support
- **No sharing** - Can't share research or collaborate
- **Memory grows** - No automatic cleanup of old memories
- **Quercle dependency** - Web search requires Quercle API

## Future Possibilities

These aren't planned, but the architecture could support:

- Team workspaces with shared memory
- Scheduled research (track topics automatically)
- Export/import knowledge bases
- Custom memory retention policies

## Development

```bash
bun dev          # Development server
bun run build    # Production build
bun test         # Run tests
bun run lint     # Lint code
```

## License

MIT - see [LICENSE](LICENSE)

---

Built with [Quercle](https://quercle.dev) + [MongoDB](https://mongodb.com)
