import { MongoClient, Db, Collection } from "mongodb";
import type { ResearchMemory, ResearchHistory } from "./schemas";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "quercle_research_agent";

if (!MONGODB_URI) {
  console.warn("MONGODB_URI not set - memory features will be disabled");
}

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesEnsured = false;

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!MONGODB_URI) {
    return null;
  }

  if (client) {
    return client;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return null;
  }
}

export async function getDatabase(): Promise<Db | null> {
  if (db) {
    return db;
  }

  const mongoClient = await getMongoClient();
  if (!mongoClient) {
    return null;
  }

  db = mongoClient.db(DB_NAME);
  return db;
}

export async function getMemoriesCollection(): Promise<Collection<ResearchMemory> | null> {
  const database = await getDatabase();
  if (!database) {
    return null;
  }

  const collection = database.collection<ResearchMemory>("memories");

  // Ensure indexes on first access
  if (!indexesEnsured) {
    indexesEnsured = true;
    await ensureIndexes(database);
  }

  return collection;
}

export async function getResearchHistoryCollection(): Promise<Collection<ResearchHistory> | null> {
  const database = await getDatabase();
  if (!database) {
    return null;
  }

  return database.collection<ResearchHistory>("research_history");
}

export async function ensureIndexes(database?: Db): Promise<void> {
  const db = database || await getDatabase();
  if (!db) {
    return;
  }

  const collection = db.collection<ResearchMemory>("memories");

  // Create indexes for common queries
  await collection.createIndex({ topic: 1 });
  await collection.createIndex({ sessionId: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ "facts.content": "text" });

  console.log("MongoDB indexes created");
}

export async function closeConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      // Ignore errors during close (connection might already be closed)
    } finally {
      client = null;
      db = null;
    }
  }
}

// Check if MongoDB is available
export function isMemoryEnabled(): boolean {
  return !!MONGODB_URI;
}
