import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { listStages } from "@/lib/queries/stages";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, stages] = await Promise.all([
    getProject(Number(id)),
    listStages(),
  ]);

  if (!project) notFound();

  return <ProjectDetailClient project={project} stages={stages} />;
}
