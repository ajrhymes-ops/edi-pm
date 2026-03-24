import { NextRequest, NextResponse } from "next/server";
import { listStages, createStage, updateStage, deleteStage } from "@/lib/queries/stages";
import { z } from "zod";

export async function GET() {
  try {
    const stages = await listStages();
    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error listing stages:", error);
    return NextResponse.json({ error: "Failed to list stages" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  sort_order: z.number().int().positive(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const stage = await createStage(data);
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating stage:", error);
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  sort_order: z.number().int().positive().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = updateSchema.parse(body);
    const stage = await updateStage(id, data);
    return NextResponse.json(stage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating stage:", error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = deleteSchema.parse(body);
    await deleteStage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error deleting stage:", error);
    return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 });
  }
}
