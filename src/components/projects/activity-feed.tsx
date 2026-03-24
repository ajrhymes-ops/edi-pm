"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import type { ActivityEntry } from "@/lib/types";
import { ACTIVITY_ACTION_LABELS } from "@/lib/constants";
import {
  Activity,
  FolderPlus,
  ArrowRight,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ACTION_ICONS: Record<string, typeof Activity> = {
  project_created: FolderPlus,
  project_updated: Pencil,
  project_deleted: Trash2,
  stage_changed: ArrowRight,
  task_created: Plus,
  task_updated: Pencil,
  task_completed: CheckCircle2,
  task_deleted: Trash2,
  comment_added: MessageSquare,
};

export function ActivityFeed({ projectId }: { projectId: number }) {
  const { data: activities } = useSWR<ActivityEntry[]>(
    `/api/projects/${projectId}/activity`,
    fetcher
  );

  return (
    <div className="space-y-3">
      {activities?.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] || Activity;
        const detail = entry.detail as Record<string, unknown>;
        let description = ACTIVITY_ACTION_LABELS[entry.action] || entry.action;

        if (entry.action === "stage_changed") {
          description = `Stage changed`;
        }
        if (detail?.title) {
          description += `: ${detail.title}`;
        }

        return (
          <div key={entry.id} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 rounded-full bg-muted p-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p>{description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}

      {activities?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity yet</p>
        </div>
      )}
    </div>
  );
}
