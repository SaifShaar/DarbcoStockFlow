import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  'data-testid'?: string;
}

const statusStyles = {
  pending: 'status-pending',
  approved: 'status-approved', 
  rejected: 'status-rejected',
  draft: 'status-draft',
  released: 'status-released',
  completed: 'status-completed',
  in_progress: 'status-in_progress',
  cancelled: 'status-cancelled',
  closed: 'status-closed',
};

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected', 
  draft: 'Draft',
  released: 'Released',
  completed: 'Completed',
  in_progress: 'In Progress',
  cancelled: 'Cancelled',
  closed: 'Closed',
};

export default function StatusBadge({ status, className, 'data-testid': testId }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || 'draft';
  const statusClass = statusStyles[normalizedStatus as keyof typeof statusStyles] || 'status-draft';
  const statusLabel = statusLabels[normalizedStatus as keyof typeof statusLabels] || status;

  return (
    <span 
      className={cn("status-badge", statusClass, className)}
      data-testid={testId}
    >
      {statusLabel}
    </span>
  );
}
