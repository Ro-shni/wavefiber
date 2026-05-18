import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface CustomerVerificationModalProps {
  complaint: any
  onClose: () => void
}

export default function CustomerVerificationModal({ complaint, onClose }: CustomerVerificationModalProps) {
  const queryClient = useQueryClient()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const verifyMutation = useMutation({
    mutationFn: async (data: { isResolved: boolean; rejectionReason?: string }) => {
      const response = await api.patch(`/complaints/${complaint._id}/verify`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.complaint.customerVerificationStatus === 'VERIFIED') {
        toast.success('Thank you! Complaint marked as resolved.')
      } else {
        toast.success('Complaint reopened. Technician has been notified.')
      }
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error processing verification')
    },
  })

  const handleYes = () => {
    if (confirm('Are you sure the issue is completely resolved?')) {
      verifyMutation.mutate({ isResolved: true })
    }
  }

  const handleNo = () => {
    if (rejectionReason.trim().length < 5) {
      toast.error('Please describe what is still not working (minimum 5 characters)')
      return
    }
    if (confirm('This will reopen the ticket and notify the technician. Continue?')) {
      verifyMutation.mutate({ isResolved: false, rejectionReason })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-3 text-white">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-xl font-bold">Complaint Verification Required</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Complaint Details</h4>
              <p className="text-sm text-blue-800">
                <strong>Type:</strong> {complaint.complaintType}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Technician:</strong> {complaint.technicianName}
              </p>
              {complaint.technicianFeedback && (
                <p className="text-sm text-blue-800 mt-2">
                  <strong>Technician's Report:</strong> {complaint.technicianFeedback}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-900 font-medium mb-2">
                The technician has marked your complaint as resolved.
              </p>
              <p className="text-gray-700 text-sm">
                Please verify if your issue has been completely fixed:
              </p>
            </div>
          </div>

          {!showRejectForm ? (
            <div className="space-y-3">
              <button
                onClick={handleYes}
                disabled={verifyMutation.isPending}
                className="w-full flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg">Yes, Issue is Resolved</span>
              </button>

              <button
                onClick={() => setShowRejectForm(true)}
                disabled={verifyMutation.isPending}
                className="w-full flex items-center justify-center space-x-3 bg-red-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-6 h-6" />
                <span className="text-lg">No, Issue Still Exists</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe what is still not working <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Example: Internet is working in the living room but not in the bedroom..."
                  required
                  minLength={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 5 characters required. Be specific so the technician can fix it.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNo}
                  disabled={verifyMutation.isPending || rejectionReason.trim().length < 5}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {verifyMutation.isPending ? 'Submitting...' : 'Submit & Reopen Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

