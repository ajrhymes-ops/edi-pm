import { NextRequest, NextResponse } from "next/server";
import { batchUpdateTasks } from "@/lib/queries/tasks";
import { z } from "zod";

const updateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.number().int().positive(),
      stage_id: z.number().int().positive(),
      sort_order: z.number().int(),
    })
  ),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = updateSchema.parse(body);
    await batchUpdateTasks(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error batch updating tasks:", error);
    return NextResponse.json({ error: "Failed to update tasks" }, { status: 500 });
  }
}
