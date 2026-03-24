import { NextRequest, NextResponse } from "next/server";
import { listActivityByProject } from "@/lib/queries/activity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await listActivityByProject(Number(id));
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error listing activity:", error);
    return NextResponse.json({ error: "Failed to list activity" }, { status: 500 });
  }
}
