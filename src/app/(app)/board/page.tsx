import { listStages } from "@/lib/queries/stages";
import { KanbanBoard } from "@/components/board/kanban-board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const stages = await listStages();

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-6">Project Board</h1>
      <div className="flex-1 min-h-0">
        <KanbanBoard stages={stages} />
      </div>
    </div>
  );
}
