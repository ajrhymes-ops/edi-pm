"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import useSWR from "swr";
import {
  addDays,
  differenceInDays,
  format,
  startOfWeek,
  startOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import type { Project, HealthStatus, Priority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  GripHorizontal,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ZoomLevel = "day" | "week" | "month";
type GroupBy = "none" | "client" | "stage" | "priority";

const ZOOM_CONFIG: Record<
  ZoomLevel,
  { pxPerDay: number; span: number }
> = {
  day: { pxPerDay: 40, span: 60 },
  week: { pxPerDay: 20, span: 120 },
  month: { pxPerDay: 8, span: 365 },
};

const HEALTH_COLORS: Record<string, string> = {
  on_track: "#10b981",
  at_risk: "#f59e0b",
  blocked: "#ef4444",
};

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 40;
const LEFT_PANEL_WIDTH = 280;

interface TreeNode {
  project: Project;
  depth: number;
  children: TreeNode[];
}

export function GanttChart() {
  const { data: allProjects, mutate } = useSWR<Project[]>(
    "/api/projects?all=true",
    fetcher
  );
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [dragging, setDragging] = useState<{
    projectId: number;
    edge: "start" | "end";
    initialX: number;
    initialDate: string;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

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
      return eachMonthOfInterval({ start: viewStart, end: viewEnd }).map(
        (d) => ({
          label: format(d, "MMM yyyy"),
          offset: differenceInDays(d, viewStart) * config.pxPerDay,
        })
      );
    }
    return eachWeekOfInterval({ start: viewStart, end: viewEnd }).map((d) => ({
      label: format(d, "MMM d"),
      offset: differenceInDays(d, viewStart) * config.pxPerDay,
    }));
  }, [viewStart, viewEnd, zoom, config.pxPerDay]);

  // Filter projects
  const filtered = useMemo(() => {
    return (allProjects ?? []).filter((p) => {
      if (!(p.start_date || p.target_date)) return false;
      if (filterHealth !== "all" && p.health_status !== filterHealth)
        return false;
      if (filterPriority !== "all" && p.priority !== filterPriority)
        return false;
      if (filterClient !== "all" && (p.client_name ?? "") !== filterClient)
        return false;
      return true;
    });
  }, [allProjects, filterHealth, filterPriority, filterClient]);

  // Get unique clients for filter
  const clients = useMemo(() => {
    const set = new Set(
      (allProjects ?? [])
        .map((p) => p.client_name)
        .filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [allProjects]);

  // Build tree structure for nesting
  const buildTree = useCallback(
    (projects: Project[]): TreeNode[] => {
      const byId = new Map(projects.map((p) => [p.id, p]));
      const childrenOf = new Map<number | null, Project[]>();

      for (const p of projects) {
        const parentKey = p.parent_id && byId.has(p.parent_id) ? p.parent_id : null;
        if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
        childrenOf.get(parentKey)!.push(p);
      }

      const build = (parentId: number | null, depth: number): TreeNode[] => {
        const kids = childrenOf.get(parentId) ?? [];
        return kids.map((p) => ({
          project: p,
          depth,
          children: build(p.id, depth + 1),
        }));
      };

      return build(null, 0);
    },
    []
  );

  // Flatten tree respecting collapsed state
  const flattenTree = useCallback(
    (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      const walk = (items: TreeNode[]) => {
        for (const node of items) {
          result.push(node);
          if (node.children.length > 0 && !collapsed.has(node.project.id)) {
            walk(node.children);
          }
        }
      };
      walk(nodes);
      return result;
    },
    [collapsed]
  );

  // Group projects if grouping is enabled
  const groupedRows = useMemo(() => {
    if (groupBy === "none") {
      const tree = buildTree(filtered);
      return [{ label: null, rows: flattenTree(tree) }];
    }

    const groups = new Map<string, Project[]>();
    for (const p of filtered) {
      let key: string;
      if (groupBy === "client") key = p.client_name || "No Client";
      else if (groupBy === "stage") key = p.stage_name || "Unknown";
      else key = p.priority;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    return Array.from(groups.entries()).map(([label, projects]) => ({
      label,
      rows: flattenTree(buildTree(projects)),
    }));
  }, [filtered, groupBy, buildTree, flattenTree]);

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    const width = Math.max(20, differenceInDays(end, start) * config.pxPerDay);
    return { left, width };
  };

  // Drag to reschedule
  const handleDragStart = (
    e: React.MouseEvent,
    projectId: number,
    edge: "start" | "end"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const project = (allProjects ?? []).find((p) => p.id === projectId);
    if (!project) return;

    const initialDate =
      edge === "start"
        ? project.start_date ?? format(new Date(), "yyyy-MM-dd")
        : project.target_date ??
          format(addDays(new Date(), 30), "yyyy-MM-dd");

    setDragging({ projectId, edge, initialX: e.clientX, initialDate });

    const onMove = (ev: MouseEvent) => {
      if (!chartRef.current) return;
      const dx = ev.clientX - e.clientX;
      const daysDelta = Math.round(dx / config.pxPerDay);
      if (daysDelta === 0) return;

      const newDate = format(
        addDays(new Date(initialDate), daysDelta),
        "yyyy-MM-dd"
      );

      // Optimistically update via SWR
      mutate(
        (current: Project[] | undefined) =>
          current?.map((p) => {
            if (p.id !== projectId) return p;
            return edge === "start"
              ? { ...p, start_date: newDate }
              : { ...p, target_date: newDate };
          }),
        false
      );
    };

    const onUp = async (ev: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      const dx = ev.clientX - e.clientX;
      const daysDelta = Math.round(dx / config.pxPerDay);
      if (daysDelta === 0) {
        setDragging(null);
        return;
      }

      const newDate = format(
        addDays(new Date(initialDate), daysDelta),
        "yyyy-MM-dd"
      );

      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          edge === "start"
            ? { start_date: newDate }
            : { target_date: newDate }
        ),
      });
      mutate();
      setDragging(null);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Draw dependency arrows (parent → child)
  const getDependencyLines = (
    flatRows: TreeNode[],
    rowStartIndex: number
  ) => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[] = [];

    const rowIndexById = new Map<number, number>();
    flatRows.forEach((node, i) => {
      rowIndexById.set(node.project.id, rowStartIndex + i);
    });

    for (const node of flatRows) {
      if (
        node.project.parent_id &&
        rowIndexById.has(node.project.parent_id)
      ) {
        const parentIdx = rowIndexById.get(node.project.parent_id)!;
        const childIdx = rowIndexById.get(node.project.id)!;

        const parent = (allProjects ?? []).find(
          (p) => p.id === node.project.parent_id
        );
        if (!parent) continue;

        const parentBar = getBarStyle(parent);
        const childBar = getBarStyle(node.project);

        const x1 = parentBar.left + parentBar.width;
        const y1 = (parentIdx - rowStartIndex) * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = childBar.left;
        const y2 = (childIdx - rowStartIndex) * ROW_HEIGHT + ROW_HEIGHT / 2;

        lines.push({ x1, y1, x2, y2 });
      }
    }
    return lines;
  };

  const zoomLevels: ZoomLevel[] = ["day", "week", "month"];
  const zoomIndex = zoomLevels.indexOf(zoom);

  const totalRows = groupedRows.reduce(
    (sum, g) => sum + g.rows.length + (g.label ? 1 : 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(zoomLevels[Math.max(0, zoomIndex - 1)])}
            disabled={zoomIndex === 0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground capitalize">
            {zoom} view
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setZoom(
                zoomLevels[Math.min(zoomLevels.length - 1, zoomIndex + 1)]
              )
            }
            disabled={zoomIndex === zoomLevels.length - 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <Select
          value={filterHealth}
          onValueChange={(v) => v && setFilterHealth(v)}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterPriority}
          onValueChange={(v) => v && setFilterPriority(v)}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {clients.length > 0 && (
          <Select
            value={filterClient}
            onValueChange={(v) => v && setFilterClient(v)}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="h-4 w-px bg-border" />

        <Select
          value={groupBy}
          onValueChange={(v) => v && setGroupBy(v as GroupBy)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="client">Group by Client</SelectItem>
            <SelectItem value="stage">Group by Stage</SelectItem>
            <SelectItem value="priority">Group by Priority</SelectItem>
          </SelectContent>
        </Select>

        {(filterHealth !== "all" ||
          filterPriority !== "all" ||
          filterClient !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => {
              setFilterHealth("all");
              setFilterPriority("all");
              setFilterClient("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Chart */}
      <div className="border rounded-lg overflow-hidden" ref={chartRef}>
        <div className="flex">
          {/* Left panel */}
          <div
            className="flex-shrink-0 border-r bg-muted/30"
            style={{ width: LEFT_PANEL_WIDTH }}
          >
            <div
              className="border-b flex items-center px-3"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="text-xs font-medium text-muted-foreground">
                Project
              </span>
            </div>

            {groupedRows.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div
                    className="border-b flex items-center px-3 bg-muted/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {group.rows.length}
                    </Badge>
                  </div>
                )}
                {group.rows.map((node) => {
                  const hasChildren = node.children.length > 0;
                  const isCollapsed = collapsed.has(node.project.id);
                  return (
                    <div
                      key={node.project.id}
                      className="border-b flex items-center px-3 gap-1"
                      style={{
                        height: ROW_HEIGHT,
                        paddingLeft: 12 + node.depth * 20,
                      }}
                    >
                      {hasChildren ? (
                        <button
                          onClick={() => toggleCollapse(node.project.id)}
                          className="p-0.5 rounded hover:bg-muted"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ) : node.depth > 0 ? (
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <div className="w-4" />
                      )}
                      <Link
                        href={`/projects/${node.project.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {node.project.name}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Right panel: timeline */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Header */}
              <div
                className="border-b relative bg-muted/20"
                style={{ height: HEADER_HEIGHT }}
              >
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
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-20"
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

                {groupedRows.map((group, gi) => {
                  // Calculate starting row for dependency lines
                  let globalRowStart = 0;
                  for (let k = 0; k < gi; k++) {
                    globalRowStart +=
                      groupedRows[k].rows.length +
                      (groupedRows[k].label ? 1 : 0);
                  }
                  if (group.label) globalRowStart += 1;

                  const lines = getDependencyLines(group.rows, globalRowStart);

                  return (
                    <div key={gi}>
                      {/* Group header row */}
                      {group.label && (
                        <div
                          className="border-b bg-muted/50"
                          style={{ height: ROW_HEIGHT }}
                        />
                      )}

                      <div className="relative">
                        {/* Dependency arrows SVG */}
                        {lines.length > 0 && (
                          <svg
                            className="absolute inset-0 z-10 pointer-events-none"
                            style={{
                              width: totalWidth,
                              height: group.rows.length * ROW_HEIGHT,
                            }}
                          >
                            <defs>
                              <marker
                                id={`arrow-${gi}`}
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                              >
                                <path
                                  d="M 0 0 L 10 5 L 0 10 z"
                                  fill="#94a3b8"
                                />
                              </marker>
                            </defs>
                            {lines.map((line, li) => {
                              // Adjust y coords relative to this group
                              const adjustedY1 =
                                (line.y1 / ROW_HEIGHT -
                                  (group.label ? 1 : 0)) *
                                  ROW_HEIGHT +
                                ROW_HEIGHT / 2;
                              // Recalculate from scratch for local group positioning
                              return null;
                            })}
                            {/* Recalculate dependency lines locally */}
                            {group.rows.map((node, ri) => {
                              if (!node.project.parent_id) return null;
                              const parentIdx = group.rows.findIndex(
                                (r) => r.project.id === node.project.parent_id
                              );
                              if (parentIdx === -1) return null;

                              const parentProject =
                                group.rows[parentIdx].project;
                              const parentBar = getBarStyle(parentProject);
                              const childBar = getBarStyle(node.project);

                              const x1 = parentBar.left + parentBar.width;
                              const y1 =
                                parentIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                              const x2 = childBar.left;
                              const y2 = ri * ROW_HEIGHT + ROW_HEIGHT / 2;

                              const midX = x1 + (x2 - x1) / 2;

                              return (
                                <path
                                  key={`dep-${node.project.id}`}
                                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                                  fill="none"
                                  stroke="#94a3b8"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 2"
                                  markerEnd={`url(#arrow-${gi})`}
                                />
                              );
                            })}
                          </svg>
                        )}

                        {group.rows.map((node) => {
                          const bar = getBarStyle(node.project);
                          const progress =
                            Number(node.project.task_count ?? 0) > 0
                              ? Number(node.project.completed_task_count ?? 0) /
                                Number(node.project.task_count ?? 1)
                              : 0;

                          return (
                            <div
                              key={node.project.id}
                              className="border-b relative"
                              style={{ height: ROW_HEIGHT }}
                            >
                              {/* Bar */}
                              <div
                                className="absolute top-2 rounded-md flex items-center text-xs text-white font-medium truncate hover:opacity-90 transition-opacity"
                                style={{
                                  left: bar.left,
                                  width: bar.width,
                                  height: ROW_HEIGHT - 16,
                                  backgroundColor:
                                    HEALTH_COLORS[
                                      node.project.health_status
                                    ] ?? "#6b7280",
                                }}
                                title={`${node.project.name}: ${node.project.start_date ?? "?"} → ${node.project.target_date ?? "?"}`}
                              >
                                {/* Progress fill */}
                                {progress > 0 && (
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-l-md bg-black/15"
                                    style={{
                                      width: `${progress * 100}%`,
                                      borderRadius:
                                        progress >= 1
                                          ? "0.375rem"
                                          : "0.375rem 0 0 0.375rem",
                                    }}
                                  />
                                )}

                                {/* Label */}
                                <span className="relative z-10 px-2 truncate">
                                  {bar.width > 80 && node.project.client_name}
                                </span>

                                {/* Drag handles */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-md"
                                  onMouseDown={(e) =>
                                    handleDragStart(
                                      e,
                                      node.project.id,
                                      "start"
                                    )
                                  }
                                >
                                  <GripHorizontal className="h-3 w-3 absolute top-1/2 -translate-y-1/2 -left-0.5 text-white/60 opacity-0 hover:opacity-100" />
                                </div>
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md"
                                  onMouseDown={(e) =>
                                    handleDragStart(
                                      e,
                                      node.project.id,
                                      "end"
                                    )
                                  }
                                >
                                  <GripHorizontal className="h-3 w-3 absolute top-1/2 -translate-y-1/2 -right-0.5 text-white/60 opacity-0 hover:opacity-100" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No projects with dates to display.</p>
          <p className="text-sm">
            Add start and target dates to your projects to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
