import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import MobileLayout from '../components/MobileLayout'
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const complaints = data?.complaints || []
  const open = complaints.filter((c: any) => c.status === 'OPEN' || c.status === 'ASSIGNED').length
  const inProgress = complaints.filter((c: any) => c.status === 'IN PROGRESS').length
  const closed = complaints.filter((c: any) => c.status === 'CLOSED').length

  const statusColor: Record<string, string> = {
    'OPEN': 'bg-yellow-100 text-yellow-700',
    'ASSIGNED': 'bg-blue-100 text-blue-700',
    'IN PROGRESS': 'bg-purple-100 text-purple-700',
    'CLOSED': 'bg-green-100 text-green-700',
    'CANCELLED': 'bg-gray-100 text-gray-700'
  }

  return (
    <MobileLayout title="My Complaints">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{open}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{inProgress}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{closed}</p>
          <p className="text-xs text-gray-500">Resolved</p>
        </div>
      </div>

      {/* New Complaint Button */}
      <button onClick={() => navigate('/new-complaint')}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold mb-6 active:bg-blue-700">
        <Plus className="w-5 h-5" /> Register New Complaint
      </button>

      {/* Complaint List */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Complaints</h3>
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No complaints yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c: any) => (
            <button key={c._id} onClick={() => navigate(`/complaint/${c._id}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left active:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{c.complaintType}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-gray-100'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Block {c.block}</span>
                <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              {c.technicianName && <p className="text-xs text-blue-600 mt-1">Tech: {c.technicianName}</p>}
            </button>
          ))}
        </div>
      )}
    </MobileLayout>
  )
}
