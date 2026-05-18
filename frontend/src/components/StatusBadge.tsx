interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Open' },
  ASSIGNED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Assigned' },
  'IN PROGRESS': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
  CLOSED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Closed' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OPEN

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-gray-100', text: 'text-gray-800' },
    MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
    URGENT: { bg: 'bg-red-100', text: 'text-red-800' },
  }

  const priorityConfig = config[priority] || config.MEDIUM

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
      {priority}
    </span>
  )
}

