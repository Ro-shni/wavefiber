import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { dashboardApi } from '../api/dashboard'
import { techniciansApi } from '../api/technicians'
import { leaveRequestsApi } from '../api/leaveRequests'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import Card from '../components/Card'
import ComplaintTable from '../components/ComplaintTable'
import LeaveRequestForm from '../components/LeaveRequestForm'
import LeaveRequestsList from '../components/LeaveRequestsList'
import toast from 'react-hot-toast'
import { FileText, Clock, CheckCircle, TrendingUp, Calendar } from 'lucide-react'

type ViewType = 'all' | 'total' | 'active' | 'completed' | 'leave'

export default function TechnicianDashboard() {
  const { technicianDetails } = useAuthStore()
  const queryClient = useQueryClient()
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('all')

  const { data: statsData } = useQuery({
    queryKey: ['technician-stats', technicianDetails?._id],
    queryFn: () => dashboardApi.getTechnicianStats(technicianDetails!._id),
    enabled: !!technicianDetails?._id,
  })

  const { data: complaintsData } = useQuery({
    queryKey: ['technician-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const { data: leaveRequestsData } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => leaveRequestsApi.getAll(),
  })

  const stats = statsData?.stats || {}
  const complaints = complaintsData?.complaints || []
  const activeComplaints = complaints.filter(
    (c: any) => c.status === 'ASSIGNED' || c.status === 'IN PROGRESS'
  )
  const completedComplaints = complaints.filter((c: any) => c.status === 'CLOSED')
  const leaveRequests = leaveRequestsData?.leaveRequests || []

  // Determine which complaints to show based on current view
  const getComplaintsForView = () => {
    switch (currentView) {
      case 'total':
        return complaints
      case 'active':
        return activeComplaints
      case 'completed':
        return completedComplaints
      default:
        return complaints
    }
  }

  const displayedComplaints = getComplaintsForView()

  return (
    <Layout title="My Assignments">
      {/* Stats Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setCurrentView('total')}
          className={`text-left transition-all ${
            currentView === 'total' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
          }`}
        >
          <Card
            title="Total Assigned"
            value={stats.totalAssigned || 0}
            icon={FileText}
            color="blue"
          />
        </button>
        <button
          onClick={() => setCurrentView('active')}
          className={`text-left transition-all ${
            currentView === 'active' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
          }`}
        >
          <Card
            title="Active Now"
            value={stats.activeNow || 0}
            icon={Clock}
            color="yellow"
          />
        </button>
        <button
          onClick={() => setCurrentView('completed')}
          className={`text-left transition-all ${
            currentView === 'completed' ? 'ring-2 ring-green-500 ring-offset-2' : ''
          }`}
        >
          <Card
            title="Completed"
            value={stats.totalClosed || 0}
            icon={CheckCircle}
            color="green"
          />
        </button>
        <div className="pointer-events-none">
          <Card
            title="Avg Resolution"
            value={`${stats.avgResolutionTime || 0}m`}
            icon={TrendingUp}
            color="purple"
            subtitle="minutes"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('all')}
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              currentView === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Assignments
          </button>
          <button
            onClick={() => setCurrentView('total')}
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              currentView === 'total'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Total ({stats.totalAssigned || 0})
          </button>
          <button
            onClick={() => setCurrentView('active')}
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              currentView === 'active'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active ({stats.activeNow || 0})
          </button>
          <button
            onClick={() => setCurrentView('completed')}
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              currentView === 'completed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed ({stats.totalClosed || 0})
          </button>
          <button
            onClick={() => setCurrentView('leave')}
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              currentView === 'leave'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Leave Management</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {currentView === 'leave' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
              <p className="text-sm text-gray-500">
                Request leave and view your leave history
              </p>
            </div>
            <button
              onClick={() => setShowLeaveForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Request Leave
            </button>
          </div>

          {leaveRequests.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Leave Requests</h4>
              <LeaveRequestsList leaveRequests={leaveRequests} />
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests yet</p>
              <button
                onClick={() => setShowLeaveForm(true)}
                className="mt-4 text-blue-600 hover:underline font-medium"
              >
                Create your first leave request
              </button>
            </div>
          )}

          {showLeaveForm && <LeaveRequestForm onClose={() => setShowLeaveForm(false)} />}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentView === 'all' && 'All Assignments'}
              {currentView === 'total' && 'Total Assigned Complaints'}
              {currentView === 'active' && 'Active Complaints'}
              {currentView === 'completed' && 'Completed Complaints'}
            </h3>
            <p className="text-sm text-gray-500">
              {displayedComplaints.length} complaint(s) in this view
            </p>
          </div>
          
          {displayedComplaints.length > 0 ? (
            <ComplaintTable complaints={displayedComplaints} />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentView === 'active' && 'No active complaints at the moment'}
                {currentView === 'completed' && 'No completed complaints yet'}
                {currentView === 'total' && 'No complaints assigned yet'}
                {currentView === 'all' && 'No complaints assigned yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
