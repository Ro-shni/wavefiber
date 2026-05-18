import { useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveRequestsApi } from '../api/leaveRequests'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'

interface LeaveRequest {
  _id: string
  technicianName: string
  startDateTime: string
  endDateTime: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedByName?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
}

interface LeaveRequestsListProps {
  leaveRequests: LeaveRequest[]
  isManager?: boolean
}

export default function LeaveRequestsList({ leaveRequests, isManager = false }: LeaveRequestsListProps) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: leaveRequestsApi.approve,
    onSuccess: () => {
      toast.success('Leave request approved')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      leaveRequestsApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Leave request rejected')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: leaveRequestsApi.cancel,
    onSuccess: () => {
      toast.success('Leave request cancelled')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const hours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) * 10) / 10
    
    if (hours < 1) {
      const minutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      return `${minutes} minutes`
    } else if (hours < 24) {
      return `${hours} hours`
    } else {
      const days = Math.round(hours / 24 * 10) / 10
      return `${days} days`
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    }

    const statusConfig = config[status] || config.PENDING

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    )
  }

  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No leave requests found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leaveRequests.map((request) => (
        <div
          key={request._id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{request.technicianName}</h3>
                {getStatusBadge(request.status)}
              </div>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Duration: {calculateDuration(request.startDateTime, request.endDateTime)}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Requested: {new Date(request.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Start</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(request.startDateTime)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">End</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(request.endDateTime)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>

            {request.status === 'APPROVED' && request.approvedByName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Approved by {request.approvedByName} on {new Date(request.approvedAt!).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}

            {request.status === 'REJECTED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Rejected by {request.approvedByName}
                  {request.rejectionReason && `: ${request.rejectionReason}`}
                </p>
              </div>
            )}

            {isManager && request.status === 'PENDING' && (
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => approveMutation.mutate(request._id)}
                  disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason (optional):')
                    rejectMutation.mutate({ id: request._id, reason: reason || undefined })
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            )}

            {!isManager && request.status === 'PENDING' && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this leave request?')) {
                    cancelMutation.mutate(request._id)
                  }
                }}
                disabled={cancelMutation.isPending}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

