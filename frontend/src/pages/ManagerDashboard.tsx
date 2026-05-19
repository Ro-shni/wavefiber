import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { dashboardApi } from '../api/dashboard'
import { settingsApi } from '../api/settings'
import { complaintsApi } from '../api/complaints'
import { leaveRequestsApi } from '../api/leaveRequests'
import Layout from '../components/Layout'
import Card, { SimpleCard } from '../components/Card'
import ComplaintTable from '../components/ComplaintTable'
import LeaveRequestsList from '../components/LeaveRequestsList'
import toast from 'react-hot-toast'
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Calendar,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ManagerDashboard() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const getGreeting = () => {
    const hour = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata", hour: "numeric", hour12: false});
    const currentHour = parseInt(hour, 10);
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: () => dashboardApi.getStats(),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const { data: complaintsData } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const { data: leaveRequestsData } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => leaveRequestsApi.getAll(),
  })

  const toggleAutoAssignMutation = useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleAutoAssign(enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success(data.message)
    },
  })

  const stats = statsData?.stats || {}
  const settings = settingsData?.settings || {}
  const complaints = complaintsData?.complaints || []
  const allLeaveRequests = leaveRequestsData?.leaveRequests || []
  const pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'PENDING')

  // Prepare chart data
  const technicianChartData = (stats.technicianPerformance || []).slice(0, 10).map((tech: any) => ({
    name: tech.name,
    handled: tech.totalComplaintsHandled,
    closed: tech.totalComplaintsClosed,
  }))

  const dailyTrendData = (stats.dailyTrend || []).map((day: any) => ({
    date: new Date(day._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    total: day.count,
    closed: day.closed,
  }))

  return (
    <Layout title="Manager Dashboard">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-blue-700">{user?.name || 'Manager'}</span>! 👋
          </h2>
          <p className="text-slate-600 mt-2">Here is your network's performance overview for today.</p>
        </div>
        <div className="sm:text-right bg-white/60 px-4 py-2 rounded-xl border border-white backdrop-blur-sm self-start sm:self-auto">
          <p className="text-sm font-semibold text-slate-700">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Total Complaints"
          value={stats.totalComplaints || 0}
          icon={FileText}
          color="blue"
        />
        <Card
          title="Open/Pending"
          value={stats.openComplaints || 0}
          icon={AlertCircle}
          color="yellow"
        />
        <Card
          title="In Progress"
          value={stats.inProgressComplaints || 0}
          icon={Clock}
          color="purple"
        />
        <Card
          title="Closed"
          value={stats.closedComplaints || 0}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Avg Resolution Time</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.avgResolutionTime || 0}</p>
          <p className="text-sm text-gray-500 mt-1">minutes per complaint</p>
        </SimpleCard>

        <SimpleCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Avg Acknowledgement Time</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.avgAcknowledgementTime || 0}</p>
          <p className="text-sm text-gray-500 mt-1">minutes to acknowledge</p>
        </SimpleCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Technician Performance */}
        <SimpleCard className="h-96">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={technicianChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="handled" fill="#3b82f6" name="Handled" />
              <Bar dataKey="closed" fill="#10b981" name="Closed" />
            </BarChart>
          </ResponsiveContainer>
        </SimpleCard>

        {/* Daily Trend */}
        <SimpleCard className="h-96">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Complaint Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
              <Line type="monotone" dataKey="closed" stroke="#10b981" name="Closed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </SimpleCard>
      </div>

      {/* Pending Leave Requests */}
      {pendingLeaveRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Leave Requests ({pendingLeaveRequests.length})
              </h3>
            </div>
            <a
              href="/manager/leave-approval"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              View All Leaves
            </a>
          </div>
          <LeaveRequestsList leaveRequests={pendingLeaveRequests.slice(0, 3)} isManager={true} />
          {pendingLeaveRequests.length > 3 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Showing 3 of {pendingLeaveRequests.length} pending requests.{' '}
              <a href="/manager/leave-approval" className="text-orange-600 hover:underline">
                View all
              </a>
            </p>
          )}
        </div>
      )}

      {/* Block Performance Metrics */}
      <SimpleCard className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Block-wise Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Acknowledgement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Resolution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closure Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(stats.blockMetrics || []).map((blockData: any) => (
                <tr key={blockData._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Block {blockData._id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{blockData.totalComplaints}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{blockData.closedComplaints}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-900">
                        {blockData.avgAcknowledgementTime 
                          ? `${Math.round(blockData.avgAcknowledgementTime)} min`
                          : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-900">
                        {blockData.avgResolutionTime 
                          ? `${Math.floor(blockData.avgResolutionTime / 60)}h ${Math.round(blockData.avgResolutionTime % 60)}m`
                          : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {blockData.closedComplaints > 0 ? (
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(blockData.closedComplaints / blockData.totalComplaints) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round((blockData.closedComplaints / blockData.totalComplaints) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SimpleCard>

      {/* Recent Complaints */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Complaints</h3>
        <ComplaintTable complaints={complaints.slice(0, 10)} loading={statsLoading} />
      </div>
    </Layout>
  )
}

