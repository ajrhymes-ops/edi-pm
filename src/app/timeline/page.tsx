import { GanttChart } from "@/components/timeline/gantt-chart";

export const dynamic = "force-dynamic";

export default function TimelinePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Timeline</h1>
      <GanttChart />
    </div>
  );
}
