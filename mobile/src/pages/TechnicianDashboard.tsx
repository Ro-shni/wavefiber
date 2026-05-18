import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import MobileLayout from '../components/MobileLayout'
import { FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const { technicianDetails } = useAuthStore()

  const { data: statsData } = useQuery({
    queryKey: ['technician-stats', technicianDetails?._id],
    queryFn: () => dashboardApi.getTechnicianStats(technicianDetails!._id),
    enabled: !!technicianDetails?._id,
  })

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['technician-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const stats = statsData?.stats || {}
  const complaints = complaintsData?.complaints || []
  const active = complaints.filter((c: any) => c.status === 'ASSIGNED' || c.status === 'IN PROGRESS')
  const completed = complaints.filter((c: any) => c.status === 'CLOSED')

  const statusColor: Record<string, string> = {
    'ASSIGNED': 'bg-blue-100 text-blue-700',
    'IN PROGRESS': 'bg-purple-100 text-purple-700',
    'CLOSED': 'bg-green-100 text-green-700',
  }

  return (
    <MobileLayout title="My Assignments">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.totalAssigned || complaints.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.activeNow || active.length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.totalClosed || completed.length}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats.avgResolutionTime || 0}m</p>
            <p className="text-xs text-gray-500">Avg Time</p>
          </div>
        </div>
      </div>

      {/* Active Complaints */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Complaints ({active.length})</h3>
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : active.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No active complaints</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {active.map((c: any) => (
            <button key={c._id} onClick={() => navigate(`/complaint/${c._id}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left active:bg-gray-50">
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900">{c.complaintType}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || ''}`}>{c.status}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{c.customerName} &middot; Block {c.block}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{c.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Completed ({completed.length})</h3>
          <div className="space-y-3">
            {completed.slice(0, 5).map((c: any) => (
              <button key={c._id} onClick={() => navigate(`/complaint/${c._id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left active:bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm text-gray-700">{c.complaintType}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">CLOSED</span>
                </div>
                <p className="text-xs text-gray-400">{c.customerName} &middot; {new Date(c.closedAt || c.createdAt).toLocaleDateString('en-IN')}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </MobileLayout>
  )
}
