import { listStages } from "@/lib/queries/stages";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const stages = await listStages();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">New Project</h1>
      <ProjectForm stages={stages} />
    </div>
  );
}
