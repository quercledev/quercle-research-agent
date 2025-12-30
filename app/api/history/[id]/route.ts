import { NextRequest } from "next/server";
import { getResearch, deleteResearch } from "@/lib/memory/operations";

// GET /api/history/[id] - Get a specific research session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const research = await getResearch(id);

  if (!research) {
    return Response.json({ error: "Research not found" }, { status: 404 });
  }

  return Response.json({ research });
}

// DELETE /api/history/[id] - Delete a research session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deleted = await deleteResearch(id);

  if (!deleted) {
    return Response.json({ error: "Failed to delete research" }, { status: 404 });
  }

  return Response.json({ success: true });
}
