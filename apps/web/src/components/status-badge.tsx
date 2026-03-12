import clsx from "clsx";

interface StatusBadgeProps {
  label: string;
  tone: "active" | "suspended" | "expired" | "demo" | "production" | "neutral";
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={clsx("status-badge", {
        "status-badge--active": tone === "active",
        "status-badge--suspended": tone === "suspended",
        "status-badge--expired": tone === "expired",
        "status-badge--demo": tone === "demo",
        "status-badge--production": tone === "production",
        "status-badge--neutral": tone === "neutral"
      })}
    >
      {label}
    </span>
  );
}
