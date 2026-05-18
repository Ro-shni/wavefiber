import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import { techniciansApi } from '../api/technicians'
import Layout from '../components/Layout'
import Card from '../components/Card'
import ComplaintTable from '../components/ComplaintTable'
import ComplaintForm from '../components/ComplaintForm'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react'

export default function StaffDashboard() {
  const [showForm, setShowForm] = useState(false)

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const { data: techniciansData } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansApi.getAll(),
  })

  const complaints = complaintsData?.complaints || []
  const technicians = techniciansData?.technicians || []
  
  const totalComplaints = complaints.length
  const openComplaints = complaints.filter((c: any) => c.status === 'OPEN' || c.status === 'ASSIGNED').length
  const inProgressComplaints = complaints.filter((c: any) => c.status === 'IN PROGRESS').length
  const closedComplaints = complaints.filter((c: any) => c.status === 'CLOSED').length
  const availableTechnicians = technicians.filter((t: any) => t.isAvailable && !t.onLeave).length

  return (
    <Layout title="Call Center Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card
          title="Total Complaints"
          value={totalComplaints}
          icon={FileText}
          color="blue"
        />
        <Card
          title="Open/Pending"
          value={openComplaints}
          icon={AlertCircle}
          color="yellow"
        />
        <Card
          title="In Progress"
          value={inProgressComplaints}
          icon={Clock}
          color="purple"
        />
        <Card
          title="Resolved"
          value={closedComplaints}
          icon={CheckCircle}
          color="green"
        />
        <Card
          title="Available Techs"
          value={availableTechnicians}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Register New Complaint Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Register New Complaint</span>
        </button>
      </div>

      {/* Technicians Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech: any) => (
            <div
              key={tech._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{tech.name}</p>
                <p className="text-sm text-gray-500">Block {tech.block}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Workload: {tech.currentWorkload} | Closed: {tech.totalComplaintsClosed}
                </p>
              </div>
              <div>
                {tech.onLeave ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    On Leave
                  </span>
                ) : tech.isAvailable ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Complaints */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Complaints</h3>
        <ComplaintTable complaints={complaints} loading={isLoading} />
      </div>

      {/* Complaint Form Modal */}
      {showForm && <ComplaintForm onClose={() => setShowForm(false)} />}
    </Layout>
  )
}

