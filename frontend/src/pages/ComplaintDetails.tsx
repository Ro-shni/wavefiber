import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import { SimpleCard } from '../components/Card'
import StatusBadge, { PriorityBadge } from '../components/StatusBadge'
import VoiceRecorder from '../components/VoiceRecorder'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle,
  Mic,
  MessageCircle,
} from 'lucide-react'

export default function ComplaintDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [feedback, setFeedback] = useState('')
  const [usedMaterial, setUsedMaterial] = useState('')
  const [remarks, setRemarks] = useState('')
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.getById(id!),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: () => complaintsApi.acknowledge(id!),
    onSuccess: () => {
      toast.success('Complaint acknowledged')
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: () =>
      complaintsApi.close(id!, {
        technicianFeedback: feedback,
        usedMaterial,
        remarks,
      }),
    onSuccess: () => {
      toast.success('Complaint closed successfully')
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
  })

  if (isLoading) {
    return (
      <Layout title="Complaint Details">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    )
  }

  const complaint = data?.complaint

  if (!complaint) {
    return (
      <Layout title="Complaint Not Found">
        <SimpleCard>
          <p className="text-center text-gray-500">Complaint not found</p>
        </SimpleCard>
      </Layout>
    )
  }

  const canAcknowledge = user?.role === 'technician' && complaint.status === 'ASSIGNED'
  const canClose = ['technician', 'manager', 'staff'].includes(user?.role || '') && 
                   ['ASSIGNED', 'IN PROGRESS'].includes(complaint.status)

  return (
    <Layout title="Complaint Details">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Card */}
      <SimpleCard className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{complaint.complaintType}</h2>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <p className="text-sm text-gray-500">Complaint ID: {complaint._id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(complaint.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          
          {complaint.assignedAt && (
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Assigned</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(complaint.assignedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
          
          {complaint.closedAt && (
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Closed</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(complaint.closedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
        </div>
      </SimpleCard>

      {/* Customer & Technician Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SimpleCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Customer Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{complaint.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {complaint.phone}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {complaint.address}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Block</p>
              <p className="font-medium text-gray-900">{complaint.block}</p>
            </div>
            {complaint.vcRId && (
              <div>
                <p className="text-sm text-gray-500">VC R ID</p>
                <p className="font-medium text-gray-900">{complaint.vcRId}</p>
              </div>
            )}
          </div>
        </SimpleCard>

        <SimpleCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Complaint Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{complaint.complaintType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium text-gray-900">{complaint.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="font-medium text-gray-900">{complaint.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assigned Technician</p>
              <p className="font-medium text-gray-900">
                {complaint.technicianName || 'Not assigned yet'}
              </p>
            </div>
            {complaint.callReceivedBy && (
              <div>
                <p className="text-sm text-gray-500">Call Received By</p>
                <p className="font-medium text-gray-900">{complaint.callReceivedBy}</p>
              </div>
            )}
          </div>
        </SimpleCard>
      </div>

      {/* Voice Recordings Section - visible to ALL roles */}
      {(complaint.voiceRecordings?.length > 0 || complaint.voiceRecordingUrl) && (
        <SimpleCard className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mic className="w-5 h-5 mr-2 text-red-500" />
            Voice Recordings
          </h3>
          <div className="space-y-4">
            {complaint.voiceRecordings?.length > 0 ? (
              complaint.voiceRecordings.map((rec: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {rec.uploaderName || 'Unknown'}
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.uploaderRole === 'technician' ? 'bg-blue-100 text-blue-800' :
                        rec.uploaderRole === 'customer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.uploaderRole}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {rec.uploadedAt && new Date(rec.uploadedAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <audio controls preload="metadata" className="w-full" src={rec.url}>
                    Your browser does not support audio playback.
                  </audio>
                  {rec.duration > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              ))
            ) : (
              // Legacy single recording fallback
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <audio controls preload="metadata" className="w-full" src={complaint.voiceRecordingUrl}>
                  Your browser does not support audio playback.
                </audio>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  {complaint.voiceRecordingDuration > 0 && (
                    <span>Duration: {Math.floor(complaint.voiceRecordingDuration / 60)}:{(complaint.voiceRecordingDuration % 60).toString().padStart(2, '0')}</span>
                  )}
                  {complaint.voiceRecordingUploadedAt && (
                    <span>Uploaded: {new Date(complaint.voiceRecordingUploadedAt).toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SimpleCard>
      )}

      {/* Add Voice Recording - for technicians, customers (own), staff, manager */}
      {complaint.status !== 'CLOSED' && complaint.status !== 'CANCELLED' && (
        <SimpleCard className="mb-6">
          {!showVoiceRecorder ? (
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              <Mic className="w-4 h-4 text-red-500" />
              Add Voice Recording
            </button>
          ) : (
            <VoiceRecorder
              onRecordingComplete={async (blob, duration) => {
                try {
                  await complaintsApi.uploadVoiceRecording(complaint._id, blob, duration)
                  toast.success('Voice recording uploaded!')
                  setShowVoiceRecorder(false)
                  queryClient.invalidateQueries({ queryKey: ['complaint', id] })
                } catch {
                  toast.error('Failed to upload voice recording')
                }
              }}
              onRecordingCancelled={() => setShowVoiceRecorder(false)}
            />
          )}
        </SimpleCard>
      )}

      {/* Chat Link */}
      {complaint.status !== 'CANCELLED' && complaint.technicianId && (
        (user?.role === 'customer' || user?.role === 'technician') && (
          <SimpleCard className="mb-6">
            <button
              onClick={() => navigate(`/chat/${complaint._id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              <MessageCircle className="w-4 h-4" />
              {user?.role === 'customer' ? 'Chat with Technician' : 'Chat with Customer'}
            </button>
          </SimpleCard>
        )
      )}

      {/* Feedback Section */}
      {(complaint.technicianFeedback || complaint.callCenterFeedback || complaint.usedMaterial || complaint.remarks) && (
        <SimpleCard className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Feedback & Notes
          </h3>
          <div className="space-y-4">
            {complaint.technicianFeedback && (
              <div>
                <p className="text-sm font-medium text-gray-700">Technician Feedback</p>
                <p className="text-gray-900 mt-1">{complaint.technicianFeedback}</p>
              </div>
            )}
            {complaint.usedMaterial && (
              <div>
                <p className="text-sm font-medium text-gray-700">Used Material</p>
                <p className="text-gray-900 mt-1">{complaint.usedMaterial}</p>
              </div>
            )}
            {complaint.callCenterFeedback && (
              <div>
                <p className="text-sm font-medium text-gray-700">Call Center Feedback</p>
                <p className="text-gray-900 mt-1">{complaint.callCenterFeedback}</p>
              </div>
            )}
            {complaint.remarks && (
              <div>
                <p className="text-sm font-medium text-gray-700">Remarks</p>
                <p className="text-gray-900 mt-1">{complaint.remarks}</p>
              </div>
            )}
          </div>
        </SimpleCard>
      )}

      {/* Actions */}
      {(canAcknowledge || canClose) && (
        <SimpleCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          
          {canAcknowledge && (
            <button
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
              className="w-full mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge Complaint'}
            </button>
          )}

          {canClose && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the work done..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Used Material
                </label>
                <input
                  type="text"
                  value={usedMaterial}
                  onChange={(e) => setUsedMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cable, Connector, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes..."
                />
              </div>

              <button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing...' : 'Close Complaint'}
              </button>
            </div>
          )}
        </SimpleCard>
      )}
    </Layout>
  )
}

