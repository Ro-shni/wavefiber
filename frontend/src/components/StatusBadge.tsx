interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
  OPEN: { bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-200', label: 'Open' },
  ASSIGNED: { bg: 'bg-yellow-50/80', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Assigned' },
  'IN PROGRESS': { bg: 'bg-purple-50/80', text: 'text-purple-700', border: 'border-purple-200', label: 'In Progress' },
  CLOSED: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Closed' },
  CANCELLED: { bg: 'bg-slate-50/80', text: 'text-slate-700', border: 'border-slate-200', label: 'Cancelled' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OPEN

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm backdrop-blur-sm ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${config.text.replace('text-', 'bg-')}`}></span>
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-slate-50/80', text: 'text-slate-700', border: 'border-slate-200' },
    MEDIUM: { bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-200' },
    HIGH: { bg: 'bg-orange-50/80', text: 'text-orange-700', border: 'border-orange-200' },
    URGENT: { bg: 'bg-red-50/80', text: 'text-red-700', border: 'border-red-200' },
  }

  const priorityConfig = config[priority] || config.MEDIUM

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm backdrop-blur-sm ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
      {priority}
    </span>
  )
}

