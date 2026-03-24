import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { listStages } from "@/lib/queries/stages";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Project</h1>
      <ProjectForm project={project} stages={stages} />
    </div>
  );
}
