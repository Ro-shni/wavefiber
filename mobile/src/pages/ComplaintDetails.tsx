import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import { saveRecordingLocally } from '../lib/offlineStorage'
import MobileLayout from '../components/MobileLayout'
import VoiceRecorder from '../components/VoiceRecorder'
import toast from 'react-hot-toast'
import { User, Phone, MapPin, Mic, MessageCircle } from 'lucide-react'

export default function ComplaintDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const [usedMaterial, setUsedMaterial] = useState('')
  const [remarks, setRemarks] = useState('')
  const [showRecorder, setShowRecorder] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.getById(id!),
    enabled: !!id,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: () => complaintsApi.acknowledge(id!),
    onSuccess: () => { toast.success('Acknowledged'); queryClient.invalidateQueries({ queryKey: ['complaint', id] }) },
  })

  const closeMutation = useMutation({
    mutationFn: () => complaintsApi.close(id!, { technicianFeedback: feedback, usedMaterial, remarks }),
    onSuccess: () => { toast.success('Complaint closed'); queryClient.invalidateQueries({ queryKey: ['complaint', id] }) },
  })

  if (isLoading) {
    return <MobileLayout title="Loading..." showBack><div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div></MobileLayout>
  }

  const complaint = data?.complaint
  if (!complaint) {
    return <MobileLayout title="Not Found" showBack><p className="text-center text-gray-500 py-12">Complaint not found</p></MobileLayout>
  }

  const canAcknowledge = user?.role === 'technician' && complaint.status === 'ASSIGNED'
  const canClose = ['technician', 'manager', 'staff'].includes(user?.role || '') && ['ASSIGNED', 'IN PROGRESS'].includes(complaint.status)

  const statusColor: Record<string, string> = {
    'OPEN': 'bg-yellow-100 text-yellow-700', 'ASSIGNED': 'bg-blue-100 text-blue-700',
    'IN PROGRESS': 'bg-purple-100 text-purple-700', 'CLOSED': 'bg-green-100 text-green-700',
  }

  const handleVoiceUpload = async (blob: Blob, duration: number) => {
    try {
      // Save locally first (offline-capable)
      await saveRecordingLocally(complaint._id, blob, duration)
      // Then upload to server
      await complaintsApi.uploadVoiceRecording(complaint._id, blob, duration)
      toast.success('Voice recording uploaded!')
      setShowRecorder(false)
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    } catch {
      toast.success('Saved locally! Will sync when online.')
      setShowRecorder(false)
    }
  }

  return (
    <MobileLayout title={complaint.complaintType} showBack>
      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[complaint.status] || 'bg-gray-100'}`}>
          {complaint.status}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Customer</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /> {complaint.customerName}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /> {complaint.phone}</div>
          <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /> {complaint.address}, Block {complaint.block}</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
        <p className="text-sm text-gray-900">{complaint.description}</p>
        {complaint.technicianName && (
          <p className="text-xs text-blue-600 mt-2">Assigned to: {complaint.technicianName}</p>
        )}
      </div>

      {/* Voice Recordings */}
      {(complaint.voiceRecordings?.length > 0 || complaint.voiceRecordingUrl) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1">
            <Mic className="w-3 h-3" /> Voice Recordings
          </h3>
          <div className="space-y-3">
            {complaint.voiceRecordings?.length > 0 ? (
              complaint.voiceRecordings.map((rec: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {rec.uploaderName}
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                        rec.uploaderRole === 'technician' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>{rec.uploaderRole}</span>
                    </span>
                  </div>
                  <audio controls preload="metadata" className="w-full h-8" src={rec.url} />
                </div>
              ))
            ) : (
              <audio controls preload="metadata" className="w-full h-8" src={complaint.voiceRecordingUrl} />
            )}
          </div>
        </div>
      )}

      {/* Add Voice Recording */}
      {complaint.status !== 'CLOSED' && complaint.status !== 'CANCELLED' && (
        <div className="mb-4">
          {showRecorder ? (
            <VoiceRecorder onRecordingComplete={handleVoiceUpload} onRecordingCancelled={() => setShowRecorder(false)} />
          ) : (
            <button onClick={() => setShowRecorder(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium active:bg-gray-200">
              <Mic className="w-4 h-4 text-red-500" /> Add Voice Recording
            </button>
          )}
        </div>
      )}

      {/* Chat Button */}
      {complaint.technicianId && (user?.role === 'customer' || user?.role === 'technician') && (
        <button onClick={() => navigate(`/chat/${complaint._id}`)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold mb-4 active:bg-blue-700">
          <MessageCircle className="w-4 h-4" />
          {user?.role === 'customer' ? 'Chat with Technician' : 'Chat with Customer'}
        </button>
      )}

      {/* Feedback */}
      {(complaint.technicianFeedback || complaint.usedMaterial || complaint.remarks) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback</h3>
          {complaint.technicianFeedback && <p className="text-sm text-gray-900 mb-1">{complaint.technicianFeedback}</p>}
          {complaint.usedMaterial && <p className="text-xs text-gray-500">Material: {complaint.usedMaterial}</p>}
          {complaint.remarks && <p className="text-xs text-gray-500">Remarks: {complaint.remarks}</p>}
        </div>
      )}

      {/* Actions */}
      {canAcknowledge && (
        <button onClick={() => acknowledgeMutation.mutate()} disabled={acknowledgeMutation.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold mb-3 active:bg-blue-700 disabled:opacity-50">
          {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge Complaint'}
        </button>
      )}

      {canClose && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Close Complaint</h3>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Technician feedback..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input value={usedMaterial} onChange={(e) => setUsedMaterial(e.target.value)} placeholder="Used material"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold active:bg-green-700 disabled:opacity-50">
            {closeMutation.isPending ? 'Closing...' : 'Close Complaint'}
          </button>
        </div>
      )}
    </MobileLayout>
  )
}
