import type { HTMLAttributes } from "react";
import type { TripStatus } from "@/types";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: TripStatus;
}

const STATUS_STYLES: Record<TripStatus, string> = {
  draft: styles.draft,
  pending_approval: styles.pendingApproval,
  approved: styles.approved,
  rejected: styles.rejected,
  active: styles.active,
  archived: styles.archived,
};

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  archived: "Archived",
};

export function StatusBadge({ status, className = "", ...props }: StatusBadgeProps) {
  const classes = [styles.badge, STATUS_STYLES[status], className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...props}>
      {STATUS_LABELS[status]}
    </span>
  );
}
