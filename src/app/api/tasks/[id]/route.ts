import { NextRequest, NextResponse } from "next/server";
import { getTask, updateTask, deleteTask } from "@/lib/queries/tasks";
import { logActivity } from "@/lib/queries/activity";
import { z } from "zod";

const updateSchema = z.object({
  stage_id: z.number().int().positive().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  sort_order: z.number().int().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    const oldTask = await getTask(taskId);
    if (!oldTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);
    const task = await updateTask(taskId, data);

    if (data.status === "done" && oldTask.status !== "done") {
      await logActivity({
        project_id: oldTask.project_id,
        task_id: taskId,
        action: "task_completed",
        detail: { title: oldTask.title },
      });
    } else {
      await logActivity({
        project_id: oldTask.project_id,
        task_id: taskId,
        action: "task_updated",
        detail: { fields: Object.keys(data) },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await logActivity({
      project_id: task.project_id,
      task_id: taskId,
      action: "task_deleted",
      detail: { title: task.title },
    });

    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
