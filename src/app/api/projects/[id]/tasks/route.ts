import { NextRequest, NextResponse } from "next/server";
import { listTasksByProject, createTask } from "@/lib/queries/tasks";
import { logActivity } from "@/lib/queries/activity";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await listTasksByProject(Number(id));
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error listing tasks:", error);
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}

const createSchema = z.object({
  stage_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
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
    const task = await createTask({ ...data, project_id: projectId });

    await logActivity({
      project_id: projectId,
      task_id: task.id,
      action: "task_created",
      detail: { title: task.title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
