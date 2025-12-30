import { describe, it, expect, beforeAll } from "bun:test";
import { config } from "dotenv";

// Load environment variables
config();

const QUERCLE_API_KEY = process.env.QUERCLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

describe("E2E: Quercle API Direct", () => {
  beforeAll(() => {
    if (!QUERCLE_API_KEY) {
      throw new Error("QUERCLE_API_KEY not set in .env");
    }
  });

  it("should fetch a webpage via Quercle", async () => {
    const response = await fetch("https://api.quercle.dev/v1/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QUERCLE_API_KEY}`,
      },
      body: JSON.stringify({
        url: "https://example.com",
        prompt: "What is this page about? One sentence.",
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result).toBeDefined();
    console.log("Fetch result:", data.result);
  }, 30000);

  it("should search via Quercle", async () => {
    const response = await fetch("https://api.quercle.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QUERCLE_API_KEY}`,
      },
      body: JSON.stringify({
        query: "What is TypeScript?",
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result).toBeDefined();
    console.log("Search result:", data.result.slice(0, 200) + "...");
  }, 150000); // 2.5 minutes timeout
});

describe("E2E: ToolLoopAgent with Quercle", () => {
  beforeAll(() => {
    if (!QUERCLE_API_KEY) {
      throw new Error("QUERCLE_API_KEY not set in .env");
    }
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not set in .env");
    }
  });

  it.skip("should use ToolLoopAgent with Quercle tools (skip: AI SDK/OpenRouter compatibility)", async () => {
    const { ToolLoopAgent, tool } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { z } = await import("zod");

    const openrouter = createOpenAI({
      apiKey: OPENROUTER_API_KEY!,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const quercleFetchTool = tool({
      description: "Fetch and analyze a webpage",
      inputSchema: z.object({
        url: z.string().url(),
        prompt: z.string(),
      }),
      execute: async ({ url, prompt }) => {
        const response = await fetch("https://api.quercle.dev/v1/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${QUERCLE_API_KEY}`,
          },
          body: JSON.stringify({ url, prompt }),
        });
        return await response.json();
      },
    });

    const agent = new ToolLoopAgent({
      model: openrouter("openai/gpt-4o-mini"),
      tools: { quercleFetch: quercleFetchTool },
      instructions: "Use quercleFetch to analyze webpages when asked.",
    });

    const result = await agent.generate({
      prompt: "Fetch https://example.com and tell me what it's about.",
    });

    console.log("Agent result:", result.text.slice(0, 200));
    console.log("Steps:", result.steps.length);

    expect(result.text).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);
  }, 90000);
});
