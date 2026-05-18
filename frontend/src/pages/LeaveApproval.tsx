import { useQuery } from '@tanstack/react-query'
import { leaveRequestsApi } from '../api/leaveRequests'
import Layout from '../components/Layout'
import { SimpleCard } from '../components/Card'
import LeaveRequestsList from '../components/LeaveRequestsList'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function LeaveApproval() {
  const { data: leaveRequestsData, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => leaveRequestsApi.getAll(),
  })

  const allLeaveRequests = leaveRequestsData?.leaveRequests || []
  const pendingRequests = allLeaveRequests.filter((lr: any) => lr.status === 'PENDING')
  const approvedRequests = allLeaveRequests.filter((lr: any) => lr.status === 'APPROVED')
  const rejectedRequests = allLeaveRequests.filter((lr: any) => lr.status === 'REJECTED')

  if (isLoading) {
    return (
      <Layout title="Leave Approval">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Leave Approval Management">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SimpleCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-600">{pendingRequests.length}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </SimpleCard>

        <SimpleCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </SimpleCard>

        <SimpleCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </SimpleCard>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Pending Leave Requests ({pendingRequests.length})
            </h2>
          </div>
          <LeaveRequestsList leaveRequests={pendingRequests} isManager={true} />
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Approved Leaves ({approvedRequests.length})
          </h2>
          <LeaveRequestsList leaveRequests={approvedRequests} isManager={true} />
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rejected Requests ({rejectedRequests.length})
          </h2>
          <LeaveRequestsList leaveRequests={rejectedRequests} isManager={true} />
        </div>
      )}

      {allLeaveRequests.length === 0 && (
        <SimpleCard>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No leave requests yet</p>
          </div>
        </SimpleCard>
      )}
    </Layout>
  )
}

