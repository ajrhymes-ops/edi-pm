import { NextRequest, NextResponse } from "next/server";
import { listCommentsByProject, createComment } from "@/lib/queries/comments";
import { logActivity } from "@/lib/queries/activity";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await listCommentsByProject(Number(id));
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error listing comments:", error);
    return NextResponse.json({ error: "Failed to list comments" }, { status: 500 });
  }
}

const createSchema = z.object({
  content: z.string().min(1),
  task_id: z.number().int().positive().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const body = await request.json();
    const data = createSchema.parse(body);
    const comment = await createComment({ ...data, project_id: projectId });

    await logActivity({
      project_id: projectId,
      task_id: data.task_id,
      action: "comment_added",
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
