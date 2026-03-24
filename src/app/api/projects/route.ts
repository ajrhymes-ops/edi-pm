import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/queries/projects";
import { logActivity } from "@/lib/queries/activity";
import { z } from "zod";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error listing projects:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  client_name: z.string().optional(),
  project_type: z.enum(["onboarding", "integration", "custom"]),
  current_stage_id: z.number().int().positive(),
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  health_status: z.enum(["on_track", "at_risk", "blocked"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const project = await createProject(data);

    await logActivity({
      project_id: project.id,
      action: "project_created",
      detail: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
