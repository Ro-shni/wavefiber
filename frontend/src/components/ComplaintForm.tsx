import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, AlertTriangle } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'

interface ComplaintFormProps {
  onClose: () => void
}

export default function ComplaintForm({ onClose }: ComplaintFormProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // Check if user has phone number
  if (!user?.phone) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            Phone Number Required
          </h3>
          <p className="text-gray-600 text-center mb-6">
            You need to add your phone number to your profile before filing a complaint. 
            Phone number is the primary key for tracking your complaints.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose()
                navigate('/profile')
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    block: user?.block || '',
    vcRId: user?.vcRId || '',
    complaintType: 'NO SIGNAL',
    description: '',
    paymentStatus: 'N/A',
  })

  const [voiceRecording, setVoiceRecording] = useState<{
    blob: Blob
    duration: number
  } | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const result = await complaintsApi.create(data)
      
      // Upload voice recording if available
      if (voiceRecording && result.complaint?._id) {
        await complaintsApi.uploadVoiceRecording(
          result.complaint._id,
          voiceRecording.blob,
          voiceRecording.duration
        )
      }
      
      return result
    },
    onSuccess: () => {
      toast.success('Complaint registered successfully!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      onClose()
    },
    onError: () => {
      toast.error('Failed to register complaint')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.phone || !formData.address || !formData.block || !formData.description) {
      toast.error('Please fill all required fields')
      return
    }
    
    if (formData.phone.length !== 10) {
      toast.error('Phone number must be 10 digits')
      return
    }
    
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Register New Complaint</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleChange}
                placeholder="e.g., A1, B2, C3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VC R ID Number
              </label>
              <input
                type="text"
                name="vcRId"
                value={formData.vcRId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complaint Type <span className="text-red-500">*</span>
              </label>
              <select
                name="complaintType"
                value={formData.complaintType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="NEWCONNECTION">New Connection</option>
                <option value="PIN COMPLAINT">PIN Complaint</option>
                <option value="NO SIGNAL">No Signal</option>
                <option value="Channels NOT CLEAR">Channels Not Clear</option>
                <option value="WIRE COMPLAINT">Wire Complaint</option>
                <option value="INESERT Smart CARD">Insert Smart Card</option>
                <option value="RECONNECTION">Reconnection</option>
                <option value="SHIFTING">Shifting</option>
                <option value="RECONNECTION+SHIFTING">Reconnection + Shifting</option>
                <option value="SETOP BOX COMPLAINT">Set-Top Box Complaint</option>
                <option value="POWER COMPLAINT">Power Complaint</option>
                <option value="BOX EXCHANGE">Box Exchange</option>
                <option value="APSFL COMPLAINT">APSFL Complaint</option>
                <option value="NO CHANNELS">No Channels</option>
                <option value="SHIFTING+ BOX EXCHANGE">Shifting + Box Exchange</option>
                <option value="ROOM CHANGE">Room Change</option>
                <option value="TUNING">Tuning</option>
                <option value="shifting+reconnection">Shifting + Reconnection</option>
                <option value="TV CHANGE">TV Change</option>
                <option value="REMOTE COMPLAINT">Remote Complaint</option>
                <option value="VIDEO AND Audio COMPLAINT">Video and Audio Complaint</option>
                <option value="HDMI cable complaint">HDMI Cable Complaint</option>
                <option value="Temporary Disconnection">Temporary Disconnection</option>
                <option value="Channel Activation">Channel Activation</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="N/A">N/A</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          {showVoiceRecorder && (
            <VoiceRecorder
              onRecordingComplete={(blob, duration) => {
                setVoiceRecording({ blob, duration })
                setShowVoiceRecorder(false)
                toast.success('Voice recording attached successfully!')
              }}
              onRecordingCancelled={() => {
                setShowVoiceRecorder(false)
              }}
            />
          )}

          {voiceRecording && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">✓ Voice recording attached</span>
                <span className="text-xs text-blue-700">({Math.floor(voiceRecording.duration / 60)}:{(voiceRecording.duration % 60).toString().padStart(2, '0')})</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceRecording(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          )}

          {!showVoiceRecorder && !voiceRecording && (
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
            >
              + Add Voice Recording (Optional)
            </button>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
