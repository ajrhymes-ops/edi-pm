import { HEALTH_STATUS_CONFIG } from "@/lib/constants";
import type { HealthStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
