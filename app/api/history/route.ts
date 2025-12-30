import { NextRequest } from "next/server";
import { listResearchHistory, saveResearch } from "@/lib/memory/operations";

// GET /api/history - List research history
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const history = await listResearchHistory(limit);

  return Response.json({ history });
}

// POST /api/history - Save a research session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { question, report, steps, status, error, startedAt, completedAt } = body;

    if (!question) {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const result = await saveResearch({
      question,
      report: report || null,
      steps: steps || [],
      status: status || "complete",
      error: error || null,
      startedAt: new Date(startedAt),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });

    if (!result.success) {
      return Response.json(
        { error: "Failed to save research - MongoDB may not be configured" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, id: result.id });
  } catch (error) {
    console.error("[History] Save error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save research" },
      { status: 500 }
    );
  }
}
