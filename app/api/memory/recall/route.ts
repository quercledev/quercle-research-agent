import { NextRequest, NextResponse } from "next/server";
import { recall } from "@/lib/memory/operations";
import { RecallInputSchema } from "@/lib/memory/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = RecallInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await recall(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Memory recall error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
