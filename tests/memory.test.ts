import { describe, it, expect } from "bun:test";
import { RememberInputSchema, RecallInputSchema } from "../lib/memory/schemas";

// Schema validation tests (don't require MongoDB)
describe("Memory Schemas", () => {
  it("should validate remember input", () => {
    const validInput = {
      topic: "test-topic",
      facts: [{ content: "A fact", confidence: "high" as const }],
    };

    const result = RememberInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject empty topic", () => {
    const invalidInput = {
      topic: "",
      facts: [{ content: "A fact" }],
    };

    const result = RememberInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject empty facts", () => {
    const invalidInput = {
      topic: "test-topic",
      facts: [],
    };

    const result = RememberInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should validate recall input", () => {
    const validInput = {
      topic: "test-topic",
      query: "search term",
      limit: 10,
    };

    const result = RecallInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should accept recall with optional fields", () => {
    const minimalInput = {};

    const result = RecallInputSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
  });

  it("should reject invalid limit (too low)", () => {
    const invalidInput = {
      limit: 0, // min is 1
    };

    const result = RecallInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject invalid limit (too high)", () => {
    const invalidInput = {
      limit: 100, // max is 50
    };

    const result = RecallInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should validate fact with all fields", () => {
    const validInput = {
      topic: "test-topic",
      facts: [{
        content: "Test content",
        source: "https://example.com",
        confidence: "high" as const,
      }],
    };

    const result = RememberInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should allow fact without optional fields", () => {
    const validInput = {
      topic: "test-topic",
      facts: [{ content: "Just content" }],
    };

    const result = RememberInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});

// Note: MongoDB integration tests are skipped due to Bun/MongoDB TLS compatibility issues
// These should be run with Node.js or in the actual Next.js environment
describe("Memory Operations", () => {
  it("should have proper module exports", async () => {
    const operations = await import("../lib/memory/operations");

    expect(typeof operations.remember).toBe("function");
    expect(typeof operations.recall).toBe("function");
    expect(typeof operations.listTopics).toBe("function");
    expect(typeof operations.forgetTopic).toBe("function");
    expect(typeof operations.getMemoryStats).toBe("function");
  });

  it("should have proper client exports", async () => {
    const client = await import("../lib/memory/client");

    expect(typeof client.getMongoClient).toBe("function");
    expect(typeof client.getDatabase).toBe("function");
    expect(typeof client.getMemoriesCollection).toBe("function");
    expect(typeof client.closeConnection).toBe("function");
    expect(typeof client.isMemoryEnabled).toBe("function");
  });

  // Note: Integration tests with actual MongoDB connection are skipped
  // due to Bun/MongoDB TLS compatibility issues. These work in the
  // actual Next.js runtime environment.
});
