"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  addDays,
  differenceInDays,
  format,
  startOfWeek,
  addWeeks,
  isToday,
  startOfMonth,
  addMonths,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Project, HealthStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ZoomLevel = "day" | "week" | "month";

const ZOOM_CONFIG: Record<ZoomLevel, { pxPerDay: number; headerFormat: string; span: number }> = {
  day: { pxPerDay: 40, headerFormat: "MMM d", span: 60 },
  week: { pxPerDay: 20, headerFormat: "MMM d", span: 120 },
  month: { pxPerDay: 8, headerFormat: "MMM yyyy", span: 365 },
};

const HEALTH_COLORS: Record<string, string> = {
  on_track: "#10b981",
  at_risk: "#f59e0b",
  blocked: "#ef4444",
};

export function GanttChart() {
  const { data: projects } = useSWR<Project[]>("/api/projects", fetcher);
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const config = ZOOM_CONFIG[zoom];

  const viewStart = useMemo(() => {
    if (zoom === "week") return startOfWeek(new Date());
    if (zoom === "month") return startOfMonth(new Date());
    return new Date();
  }, [zoom]);

  const viewEnd = addDays(viewStart, config.span);
  const totalWidth = config.span * config.pxPerDay;

  const todayOffset = differenceInDays(new Date(), viewStart) * config.pxPerDay;

  const headerMarks = useMemo(() => {
    if (zoom === "month") {
      return eachMonthOfInterval({ start: viewStart, end: viewEnd }).map((d) => ({
        date: d,
        label: format(d, "MMM yyyy"),
        offset: differenceInDays(d, viewStart) * config.pxPerDay,
      }));
    }
    return eachWeekOfInterval({ start: viewStart, end: viewEnd }).map((d) => ({
      date: d,
      label: format(d, "MMM d"),
      offset: differenceInDays(d, viewStart) * config.pxPerDay,
    }));
  }, [viewStart, viewEnd, zoom, config.pxPerDay]);

  const activeProjects = (projects ?? []).filter(
    (p) => p.start_date || p.target_date
  );

  const getBarStyle = (project: Project) => {
    const start = project.start_date
      ? new Date(project.start_date)
      : new Date();
    const end = project.target_date
      ? new Date(project.target_date)
      : addDays(start, 30);

    const left = Math.max(
      0,
      differenceInDays(start, viewStart) * config.pxPerDay
    );
    const width = Math.max(
      20,
      differenceInDays(end, start) * config.pxPerDay
    );

    return { left, width };
  };

  const zoomLevels: ZoomLevel[] = ["day", "week", "month"];
  const zoomIndex = zoomLevels.indexOf(zoom);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(zoomLevels[Math.max(0, zoomIndex - 1)])}
          disabled={zoomIndex === 0}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground capitalize">{zoom} view</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setZoom(zoomLevels[Math.min(zoomLevels.length - 1, zoomIndex + 1)])
          }
          disabled={zoomIndex === zoomLevels.length - 1}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Left panel: project names */}
          <div className="w-64 flex-shrink-0 border-r bg-muted/30">
            <div className="h-10 border-b flex items-center px-3">
              <span className="text-xs font-medium text-muted-foreground">
                Project
              </span>
            </div>
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="h-12 border-b flex items-center px-3"
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium hover:underline truncate"
                >
                  {project.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Right panel: timeline */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Header */}
              <div className="h-10 border-b relative bg-muted/20">
                {headerMarks.map((mark, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center border-l"
                    style={{ left: mark.offset }}
                  >
                    <span className="text-xs text-muted-foreground px-2">
                      {mark.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="relative">
                {/* Today marker */}
                {todayOffset >= 0 && todayOffset <= totalWidth && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                    style={{ left: todayOffset }}
                  >
                    <div className="absolute -top-5 -left-3 text-[10px] text-red-500 font-medium">
                      Today
                    </div>
                  </div>
                )}

                {/* Grid lines */}
                {headerMarks.map((mark, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-border/50"
                    style={{ left: mark.offset }}
                  />
                ))}

                {activeProjects.map((project) => {
                  const bar = getBarStyle(project);
                  return (
                    <div key={project.id} className="h-12 border-b relative">
                      <div
                        className="absolute top-2 h-8 rounded-md flex items-center px-2 text-xs text-white font-medium truncate cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          backgroundColor:
                            HEALTH_COLORS[project.health_status] ?? "#6b7280",
                        }}
                        title={`${project.name}: ${project.start_date ?? "?"} → ${project.target_date ?? "?"}`}
                      >
                        {bar.width > 80 && project.client_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No projects with dates to display.</p>
          <p className="text-sm">Add start and target dates to your projects to see them here.</p>
        </div>
      )}
    </div>
  );
}
