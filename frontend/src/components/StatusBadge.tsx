import type { SessionStatus } from '../types';

interface StatusBadgeProps {
  status: SessionStatus;
}

const config: Record<SessionStatus, { label: string; className: string; dot: string }> = {
  waiting:   { label: 'Waiting',   className: 'badge-waiting',   dot: 'bg-yellow-400 animate-pulse' },
  measuring: { label: 'Measuring', className: 'badge-measuring', dot: 'bg-brand-400 animate-pulse' },
  done:      { label: 'Done',      className: 'badge-done',      dot: 'bg-green-400' },
  error:     { label: 'Error',     className: 'badge-error',     dot: 'bg-red-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, dot } = config[status] ?? config.error;
  return (
    <span className={className} role="status" aria-label={`Status: ${label}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
