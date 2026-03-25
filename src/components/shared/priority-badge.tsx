"use client";

import { PRIORITY_CONFIG } from "@/lib/constants";
import { useTheme } from "@/components/providers/theme-provider";
import type { Priority } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { theme } = useTheme();
  const config = PRIORITY_CONFIG[priority];
  const bg = theme === "dark" ? config.darkBgColor : config.bgColor;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
