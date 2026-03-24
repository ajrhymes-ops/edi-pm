import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/queries/projects";
import { logActivity } from "@/lib/queries/activity";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(Number(id));
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error getting project:", error);
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  client_name: z.string().optional(),
  project_type: z.enum(["onboarding", "integration", "custom"]).optional(),
  current_stage_id: z.number().int().positive().optional(),
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  health_status: z.enum(["on_track", "at_risk", "blocked"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const oldProject = await getProject(projectId);
    if (!oldProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    // Check for stage change
    if (data.current_stage_id && data.current_stage_id !== oldProject.current_stage_id) {
      await logActivity({
        project_id: projectId,
        action: "stage_changed",
        detail: {
          from_stage_id: oldProject.current_stage_id,
          to_stage_id: data.current_stage_id,
        },
      });
    } else {
      await logActivity({
        project_id: projectId,
        action: "project_updated",
        detail: { fields: Object.keys(data) },
      });
    }

    const project = await updateProject(projectId, data);
    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProject(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
