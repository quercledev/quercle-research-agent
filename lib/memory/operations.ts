import { ObjectId } from "mongodb";
import { getMemoriesCollection, getResearchHistoryCollection } from "./client";
import type { ResearchMemory, Fact, RememberInput, RecallInput, ResearchHistory, ResearchStep } from "./schemas";

export interface RememberResult {
  success: boolean;
  memoriesUpdated: number;
  factsAdded: number;
  message: string;
}

export interface RecallResult {
  success: boolean;
  memories: Array<{
    topic: string;
    question?: string;
    facts: Fact[];
    createdAt: Date;
  }>;
  totalFacts: number;
  message: string;
}

/**
 * Store facts in memory, creating or updating a memory document for the topic
 */
export async function remember(input: RememberInput): Promise<RememberResult> {
  const collection = await getMemoriesCollection();

  if (!collection) {
    return {
      success: false,
      memoriesUpdated: 0,
      factsAdded: 0,
      message: "MongoDB not configured - memory features are disabled",
    };
  }

  const sessionId = input.sessionId || "default";
  const now = new Date();

  // Prepare facts with timestamps
  const factsToAdd: Fact[] = input.facts.map((f) => ({
    content: f.content,
    source: f.source,
    confidence: f.confidence || "medium",
    createdAt: now,
  }));

  // Try to find existing memory for this topic in this session
  const existingMemory = await collection.findOne({
    topic: input.topic,
    sessionId,
  });

  if (existingMemory) {
    // Update existing memory - append new facts
    await collection.updateOne(
      { _id: existingMemory._id },
      {
        $push: { facts: { $each: factsToAdd } },
        $set: { updatedAt: now },
      }
    );

    return {
      success: true,
      memoriesUpdated: 1,
      factsAdded: factsToAdd.length,
      message: `Added ${factsToAdd.length} facts to existing memory for topic "${input.topic}"`,
    };
  } else {
    // Create new memory document
    const newMemory: ResearchMemory = {
      sessionId,
      topic: input.topic,
      facts: factsToAdd,
      sourcesVisited: input.facts
        .filter((f) => f.source)
        .map((f) => f.source as string),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(newMemory);

    return {
      success: true,
      memoriesUpdated: 1,
      factsAdded: factsToAdd.length,
      message: `Created new memory for topic "${input.topic}" with ${factsToAdd.length} facts`,
    };
  }
}

/**
 * Recall memories based on topic and/or search query
 */
export async function recall(input: RecallInput): Promise<RecallResult> {
  const collection = await getMemoriesCollection();

  if (!collection) {
    return {
      success: false,
      memories: [],
      totalFacts: 0,
      message: "MongoDB not configured - memory features are disabled",
    };
  }

  // Build query
  const query: Record<string, unknown> = {};

  if (input.topic) {
    // Case-insensitive topic search
    query.topic = { $regex: input.topic, $options: "i" };
  }

  if (input.query) {
    // Full-text search on fact content
    query.$text = { $search: input.query };
  }

  // If no filters, return recent memories
  const memories = await collection
    .find(query)
    .sort({ updatedAt: -1 })
    .limit(input.limit || 10)
    .toArray();

  if (memories.length === 0) {
    return {
      success: true,
      memories: [],
      totalFacts: 0,
      message: input.topic || input.query
        ? `No memories found for ${input.topic ? `topic "${input.topic}"` : ""}${input.query ? ` matching "${input.query}"` : ""}`
        : "No memories stored yet",
    };
  }

  const totalFacts = memories.reduce((sum, m) => sum + m.facts.length, 0);

  return {
    success: true,
    memories: memories.map((m) => ({
      topic: m.topic,
      question: m.question,
      facts: m.facts,
      createdAt: m.createdAt,
    })),
    totalFacts,
    message: `Found ${memories.length} memories with ${totalFacts} total facts`,
  };
}

/**
 * Get all topics in memory
 */
export async function listTopics(): Promise<string[]> {
  const collection = await getMemoriesCollection();

  if (!collection) {
    return [];
  }

  const topics = await collection.distinct("topic");
  return topics;
}

/**
 * Delete memories by topic
 */
export async function forgetTopic(topic: string): Promise<{ deleted: number }> {
  const collection = await getMemoriesCollection();

  if (!collection) {
    return { deleted: 0 };
  }

  const result = await collection.deleteMany({ topic });
  return { deleted: result.deletedCount };
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(): Promise<{
  totalMemories: number;
  totalFacts: number;
  topics: string[];
  oldestMemory: Date | null;
  newestMemory: Date | null;
}> {
  const collection = await getMemoriesCollection();

  if (!collection) {
    return {
      totalMemories: 0,
      totalFacts: 0,
      topics: [],
      oldestMemory: null,
      newestMemory: null,
    };
  }

  const stats = await collection
    .aggregate([
      {
        $group: {
          _id: null,
          totalMemories: { $sum: 1 },
          totalFacts: { $sum: { $size: "$facts" } },
          topics: { $addToSet: "$topic" },
          oldestMemory: { $min: "$createdAt" },
          newestMemory: { $max: "$createdAt" },
        },
      },
    ])
    .toArray();

  if (stats.length === 0) {
    return {
      totalMemories: 0,
      totalFacts: 0,
      topics: [],
      oldestMemory: null,
      newestMemory: null,
    };
  }

  return {
    totalMemories: stats[0].totalMemories,
    totalFacts: stats[0].totalFacts,
    topics: stats[0].topics,
    oldestMemory: stats[0].oldestMemory,
    newestMemory: stats[0].newestMemory,
  };
}

// ============================================
// Research History Operations
// ============================================

export interface SaveResearchInput {
  question: string;
  report: string | null;
  steps: ResearchStep[];
  status: "researching" | "synthesizing" | "complete" | "error";
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

export interface ResearchHistoryItem {
  id: string;
  question: string;
  report: string | null;
  steps: ResearchStep[];
  status: "researching" | "synthesizing" | "complete" | "error";
  error?: string | null;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
}

/**
 * Save a research session to history
 */
export async function saveResearch(input: SaveResearchInput): Promise<{ success: boolean; id: string | null }> {
  const collection = await getResearchHistoryCollection();

  if (!collection) {
    return { success: false, id: null };
  }

  const now = input.completedAt || new Date();
  const duration = now.getTime() - input.startedAt.getTime();

  const research: ResearchHistory = {
    question: input.question,
    report: input.report,
    steps: input.steps,
    status: input.status,
    error: input.error || null,
    startedAt: input.startedAt,
    completedAt: now,
    duration,
  };

  const result = await collection.insertOne(research);

  return {
    success: true,
    id: result.insertedId.toString(),
  };
}

/**
 * Get a specific research session by ID
 */
export async function getResearch(id: string): Promise<ResearchHistoryItem | null> {
  const collection = await getResearchHistoryCollection();

  if (!collection) {
    return null;
  }

  try {
    const research = await collection.findOne({ _id: new ObjectId(id) });

    if (!research) {
      return null;
    }

    return {
      id: research._id!.toString(),
      question: research.question,
      report: research.report,
      steps: research.steps,
      status: research.status,
      error: research.error,
      startedAt: research.startedAt,
      completedAt: research.completedAt || null,
      duration: research.duration || null,
    };
  } catch {
    return null;
  }
}

/**
 * List research history (most recent first)
 */
export async function listResearchHistory(limit: number = 20): Promise<ResearchHistoryItem[]> {
  const collection = await getResearchHistoryCollection();

  if (!collection) {
    return [];
  }

  const researches = await collection
    .find({})
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();

  return researches.map((r) => ({
    id: r._id!.toString(),
    question: r.question,
    report: r.report,
    steps: r.steps,
    status: r.status,
    error: r.error,
    startedAt: r.startedAt,
    completedAt: r.completedAt || null,
    duration: r.duration || null,
  }));
}

/**
 * Delete a research session
 */
export async function deleteResearch(id: string): Promise<boolean> {
  const collection = await getResearchHistoryCollection();

  if (!collection) {
    return false;
  }

  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  } catch {
    return false;
  }
}
