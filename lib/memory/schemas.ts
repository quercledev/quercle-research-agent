import { z } from "zod";
import { ObjectId } from "mongodb";

// Fact schema - individual pieces of knowledge
export const FactSchema = z.object({
  content: z.string().min(1),
  source: z.string().url().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  createdAt: z.date().default(() => new Date()),
});

export type Fact = z.infer<typeof FactSchema>;

// Research memory document schema
export const ResearchMemorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  sessionId: z.string(),
  topic: z.string().min(1),
  question: z.string().optional(),
  facts: z.array(FactSchema).default([]),
  sourcesVisited: z.array(z.string()).default([]),
  report: z.string().optional(),
  metadata: z
    .object({
      model: z.string().optional(),
      totalSteps: z.number().optional(),
      duration: z.number().optional(),
    })
    .default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ResearchMemory = z.infer<typeof ResearchMemorySchema>;

// Input schemas for tools
export const RememberInputSchema = z.object({
  topic: z.string().min(1).describe("The topic or category to store this under"),
  facts: z
    .array(
      z.object({
        content: z.string().min(1).describe("The fact or insight to remember"),
        source: z.string().optional().describe("URL or source of this information"),
        confidence: z
          .enum(["high", "medium", "low"])
          .optional()
          .describe("How confident are you in this fact"),
      })
    )
    .min(1)
    .describe("List of facts to remember"),
  sessionId: z.string().optional().describe("Session ID to associate with"),
});

export type RememberInput = z.infer<typeof RememberInputSchema>;

export const RecallInputSchema = z.object({
  topic: z.string().optional().describe("Topic to filter memories by"),
  query: z.string().optional().describe("Search query to find relevant memories"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of memories to return"),
});

export type RecallInput = z.infer<typeof RecallInputSchema>;

// Research history schema - stores complete research sessions
export const ResearchStepSchema = z.object({
  id: z.string(),
  type: z.enum(["thinking", "search", "fetch", "recall", "remember", "synthesis", "error"]),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "running", "complete", "error"]),
  toolInput: z.record(z.unknown()).optional(),
  toolOutput: z.unknown().optional(),
  duration: z.number().optional(),
  timestamp: z.date(),
  stepNumber: z.number().optional(),
});

export type ResearchStep = z.infer<typeof ResearchStepSchema>;

export const ResearchHistorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  question: z.string(),
  report: z.string().nullable(),
  steps: z.array(ResearchStepSchema).default([]),
  status: z.enum(["researching", "synthesizing", "complete", "error"]),
  error: z.string().nullable().optional(),
  startedAt: z.date(),
  completedAt: z.date().nullable().optional(),
  duration: z.number().optional(), // in milliseconds
  model: z.string().nullable().optional(),
});

export type ResearchHistory = z.infer<typeof ResearchHistorySchema>;
