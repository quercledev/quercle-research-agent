import { NextRequest } from "next/server";
import { streamText, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { remember, recall } from "@/lib/memory/operations";

// Backend-only environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const QUERCLE_API_KEY = process.env.QUERCLE_API_KEY;
const MODEL = process.env.MODEL || "openai/gpt-5-nano";

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY not set");
}
if (!QUERCLE_API_KEY) {
  console.error("QUERCLE_API_KEY not set");
}

// Create OpenRouter client using official provider
const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || "",
});

// Tool implementations
async function executeSearch(query: string) {
  console.log("[Tool] quercleSearch:", query);
  const response = await fetch("https://api.quercle.dev/v1/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QUERCLE_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Tool] quercleSearch error:", error);
    return { error: `Search failed: ${error}` };
  }

  const data = await response.json();
  console.log("[Tool] quercleSearch result:", data.result?.slice(0, 100));
  return data;
}

async function executeFetch(url: string, prompt: string) {
  console.log("[Tool] quercleFetch:", url);
  const response = await fetch("https://api.quercle.dev/v1/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QUERCLE_API_KEY}`,
    },
    body: JSON.stringify({ url, prompt }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Tool] quercleFetch error:", error);
    return { error: `Fetch failed: ${error}` };
  }

  const data = await response.json();
  console.log("[Tool] quercleFetch result:", data.result?.slice(0, 100));
  return data;
}

async function executeRemember(topic: string, facts: Array<{ content: string; source?: string }>) {
  console.log("[Tool] remember:", topic, facts.length, "facts");
  return await remember({ topic, facts });
}

async function executeRecall(topic?: string, query?: string) {
  console.log("[Tool] recall:", topic, query);
  return await recall({ topic, query, limit: 5 });
}

// Get today's date in English format
function getTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate system prompt with current date
function getSystemPrompt(todayDate: string): string {
  return `You are a research assistant with web search capabilities and persistent memory.

Today's date: ${todayDate}

## Available Tools

**Web Research:**
- quercleSearch: Search the web for information on any topic
- quercleFetch: Read and analyze a specific webpage in detail

**Memory System (IMPORTANT):**
- recall: Read from your persistent memory. Use this FIRST at the start of every research to check what you already know about the topic. This helps avoid redundant searches and builds on past research.
- remember: Write to your persistent memory. Use this at the END of your research to store key findings, facts, and insights for future reference. Include source URLs when available.

## Research Process

1. **START with memory**: Always call recall first to check existing knowledge about the topic
2. **Search the web**: Use quercleSearch to find current information (2-3 calls max)
3. **Deep dive sources**: Use quercleFetch for the most important/relevant sources (2-3 calls max)
4. **SAVE to memory**: Before writing your response, use remember to store the most important new findings
5. **Write response**: ALWAYS end by writing a comprehensive text response

IMPORTANT: You MUST write a final text response to the user. Do not end with only tool calls.

Keep tool usage efficient - aim for 5-8 total tool calls before writing your response.

## Response Formatting

Your final response MUST use proper Markdown formatting:
- Use ## headers for main sections
- Use **bold** for emphasis and key terms
- Use bullet points and numbered lists for clarity
- Include [source links](url) for citations
- Use > blockquotes for important quotes
- Use code blocks if showing technical content`;
}

export async function POST(request: NextRequest) {
  if (!OPENROUTER_API_KEY || !QUERCLE_API_KEY) {
    return Response.json(
      { error: "Server not configured. Missing API keys." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Support both useChat format (messages array) and direct question
    let question: string;
    if (body.messages && Array.isArray(body.messages)) {
      // useChat sends messages array - get the last user message
      const lastUserMessage = body.messages.filter((m: { role: string }) => m.role === "user").pop();
      question = lastUserMessage?.content || "";
    } else {
      question = body.question || "";
    }

    if (!question || typeof question !== "string") {
      return Response.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    console.log("[Research] Starting:", question);
    console.log("[Research] Model:", MODEL);

    // Get today's date once for this request
    const todayDate = getTodayDate();
    const systemPrompt = getSystemPrompt(todayDate);

    // Use streamText with multi-step tool calling for real-time streaming
    const result = streamText({
      model: openrouter(MODEL),
      system: systemPrompt,
      prompt: `Research this question thoroughly:\n\n${question}`,
      tools: {
        quercleSearch: {
          description: "Search the web for information on any topic. Returns AI-synthesized results from multiple sources with citations.",
          inputSchema: z.object({
            query: z.string().describe("The search query"),
          }),
          execute: async ({ query }: { query: string }) => {
            return await executeSearch(query);
          },
        },
        quercleFetch: {
          description: "Fetch and analyze a specific webpage with AI. Use this to dive deeper into a source.",
          inputSchema: z.object({
            url: z.string().describe("The URL to fetch and analyze"),
            prompt: z.string().describe("Instructions for how to analyze the page"),
          }),
          execute: async ({ url, prompt }: { url: string; prompt: string }) => {
            return await executeFetch(url, prompt);
          },
        },
        remember: {
          description: "Store important facts in long-term memory for later recall.",
          inputSchema: z.object({
            topic: z.string().describe("The topic to store facts under"),
            facts: z.array(
              z.object({
                content: z.string().describe("The fact to remember"),
                source: z.string().optional().describe("Source URL"),
              })
            ).describe("Facts to store"),
          }),
          execute: async ({ topic, facts }: { topic: string; facts: Array<{ content: string; source?: string }> }) => {
            return await executeRemember(topic, facts);
          },
        },
        recall: {
          description: "Retrieve facts from long-term memory. Use BEFORE searching to check existing knowledge.",
          inputSchema: z.object({
            topic: z.string().optional().describe("Filter by topic"),
            query: z.string().optional().describe("Search keywords"),
          }),
          execute: async ({ topic, query }: { topic?: string; query?: string }) => {
            return await executeRecall(topic, query);
          },
        },
      },
      stopWhen: stepCountIs(20),
      onStepFinish: ({ text, toolCalls }) => {
        if (toolCalls && toolCalls.length > 0) {
          console.log("[Step] Tool calls:", toolCalls.map((t: { toolName: string }) => t.toolName));
        }
        if (text) {
          console.log("[Step] Text:", text.slice(0, 100));
        }
      },
    });

    // Create custom SSE stream with explicit JSON events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          // Send model info at the start
          send({ type: "model", model: MODEL });

          for await (const part of result.fullStream) {
            switch (part.type) {
              case "start-step":
                send({ type: "step-start" });
                break;

              case "finish-step":
                send({ type: "step-finish" });
                break;

              case "tool-call":
                send({
                  type: "tool-call",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  args: part.input,
                });
                break;

              case "tool-result":
                send({
                  type: "tool-result",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  result: part.output,
                });
                break;

              case "text-delta":
                if (part.text) {
                  console.log("[Stream] text-delta:", part.text.slice(0, 50));
                }
                send({
                  type: "text-delta",
                  delta: part.text,
                });
                break;

              case "finish":
                send({
                  type: "finish",
                  finishReason: part.finishReason,
                });
                break;

              case "error":
                send({
                  type: "error",
                  error: String(part.error),
                });
                break;

              case "tool-error":
                // Tool execution failed - send as tool-result with error
                send({
                  type: "tool-result",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  result: { error: String(part.error) },
                });
                break;

              default:
                // Handle reasoning/thinking content from models with extended thinking
                // Types may not include all runtime part types (reasoning-start, reasoning-delta, reasoning-end)
                if (part.type === "reasoning-start") {
                  const reasoningPart = part as { id?: string };
                  if (reasoningPart.id) {
                    send({ type: "reasoning-start", id: reasoningPart.id });
                  }
                } else if (part.type === "reasoning-delta") {
                  const reasoningPart = part as { id?: string; text?: string; delta?: string };
                  if (reasoningPart.id) {
                    send({
                      type: "reasoning-delta",
                      id: reasoningPart.id,
                      text: reasoningPart.text || reasoningPart.delta || "",
                    });
                  }
                } else if (part.type === "reasoning-end") {
                  const reasoningPart = part as { id?: string };
                  if (reasoningPart.id) {
                    send({ type: "reasoning-end", id: reasoningPart.id });
                  }
                }
                break;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          send({ type: "error", error: err instanceof Error ? err.message : "Stream error" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Research] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 }
    );
  }
}
