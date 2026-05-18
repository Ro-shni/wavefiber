import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { X, Pause, Play, Clock } from 'lucide-react'

interface PauseTimerModalProps {
  complaint: any
  onClose: () => void
}

export default function PauseTimerModal({ complaint, onClose }: PauseTimerModalProps) {
  const [pauseReason, setPauseReason] = useState('')
  const queryClient = useQueryClient()

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/complaints/${complaint._id}/pause`, { pauseReason })
      return response.data
    },
    onSuccess: () => {
      toast.success('Timer paused successfully')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pause timer')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/complaints/${complaint._id}/resume`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Timer resumed successfully')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resume timer')
    },
  })

  const handlePause = () => {
    if (pauseReason.trim().length < 5) {
      toast.error('Please provide a reason (minimum 5 characters)')
      return
    }
    pauseMutation.mutate()
  }

  const handleResume = () => {
    if (confirm('Are you sure you want to resume the timer?')) {
      resumeMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-3 text-white">
            <Clock className="w-6 h-6" />
            <h3 className="text-xl font-bold">
              {complaint.isPaused ? 'Resume Timer' : 'Pause Timer'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Complaint Details</h4>
              <p className="text-sm text-gray-700">
                <strong>Type:</strong> {complaint.complaintType}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Customer:</strong> {complaint.customerName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> {complaint.status}
              </p>
              {complaint.totalPausedMinutes > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  <strong>Total Paused Time:</strong> {Math.floor(complaint.totalPausedMinutes / 60)}h {complaint.totalPausedMinutes % 60}m
                </p>
              )}
            </div>

            {complaint.isPaused ? (
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-medium">
                    ⏸️ Timer is currently paused
                  </p>
                  {complaint.pauseHistory && complaint.pauseHistory.length > 0 && (
                    <p className="text-sm text-yellow-700 mt-2">
                      <strong>Last pause reason:</strong> {complaint.pauseHistory[complaint.pauseHistory.length - 1].pauseReason}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleResume}
                  disabled={resumeMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Play className="w-6 h-6" />
                  <span>{resumeMutation.isPending ? 'Resuming...' : 'Resume Timer'}</span>
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Pausing <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Example: Waiting for customer response, need spare parts, escalated to senior technician..."
                  required
                  minLength={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 5 characters required. Be specific about why you're pausing.
                </p>

                <button
                  onClick={handlePause}
                  disabled={pauseMutation.isPending || pauseReason.trim().length < 5}
                  className="w-full mt-4 flex items-center justify-center space-x-3 bg-orange-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                  <span>{pauseMutation.isPending ? 'Pausing...' : 'Pause Timer'}</span>
                </button>
              </div>
            )}
          </div>

          {complaint.pauseHistory && complaint.pauseHistory.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Pause History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {complaint.pauseHistory.map((pause: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                    <p className="text-gray-700">
                      <strong>Reason:</strong> {pause.pauseReason}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Paused: {new Date(pause.pausedAt).toLocaleString()}
                    </p>
                    {pause.resumedAt && (
                      <>
                        <p className="text-gray-600 text-xs">
                          Resumed: {new Date(pause.resumedAt).toLocaleString()}
                        </p>
                        <p className="text-orange-600 text-xs font-medium">
                          Duration: {pause.durationMinutes} minutes
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

