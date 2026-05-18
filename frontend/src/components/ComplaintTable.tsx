import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge, { PriorityBadge } from './StatusBadge'
import { Clock, MapPin, User, Pause, Play } from 'lucide-react'
import PauseTimerModal from './PauseTimerModal'
import { useAuthStore } from '../store/authStore'

interface Complaint {
  _id: string
  customerName: string
  phone: string
  address: string
  block: string
  complaintType: string
  description: string
  status: string
  priority: string
  technicianName?: string
  createdAt: string
  closedAt?: string
  durationMinutes?: number
  isPaused?: boolean
  pauseHistory?: any[]
  totalPausedMinutes?: number
}

interface ComplaintTableProps {
  complaints: Complaint[]
  loading?: boolean
}

export default function ComplaintTable({ complaints, loading }: ComplaintTableProps) {
  const [selectedComplaintForPause, setSelectedComplaintForPause] = useState<any>(null)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!complaints || complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No complaints found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Complaint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {user?.role === 'technician' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timer
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <tr
                key={complaint._id}
                onClick={() => navigate(`/complaint/${complaint._id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{complaint.customerName}</div>
                      <div className="text-sm text-gray-500">{complaint.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{complaint.complaintType}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{complaint.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {complaint.block}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {complaint.technicianName || 'Not assigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={complaint.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                {user?.role === 'technician' && (
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (complaint.status !== 'CLOSED') {
                        setSelectedComplaintForPause(complaint)
                      }
                    }}
                  >
                    {complaint.status !== 'CLOSED' && (
                      <button
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                          complaint.isPaused
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                        title={complaint.isPaused ? 'Resume timer' : 'Pause timer'}
                      >
                        {complaint.isPaused ? (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pause/Resume Timer Modal */}
      {selectedComplaintForPause && (
        <PauseTimerModal
          complaint={selectedComplaintForPause}
          onClose={() => setSelectedComplaintForPause(null)}
        />
      )}
    </div>
  )
}

