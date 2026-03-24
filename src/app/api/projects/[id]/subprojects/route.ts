import { NextRequest, NextResponse } from "next/server";
import { listSubProjects } from "@/lib/queries/projects";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subProjects = await listSubProjects(Number(id));
    return NextResponse.json(subProjects);
  } catch (error) {
    console.error("Error listing sub-projects:", error);
    return NextResponse.json(
      { error: "Failed to list sub-projects" },
      { status: 500 }
    );
  }
}
