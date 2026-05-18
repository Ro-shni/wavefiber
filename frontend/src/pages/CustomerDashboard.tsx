import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import Layout from '../components/Layout'
import Card from '../components/Card'
import ComplaintTable from '../components/ComplaintTable'
import ComplaintForm from '../components/ComplaintForm'
import CustomerVerificationModal from '../components/CustomerVerificationModal'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function CustomerDashboard() {
  const [showForm, setShowForm] = useState(false)
  const [verificationComplaint, setVerificationComplaint] = useState<any>(null)
  const { user } = useAuthStore()

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const complaints = complaintsData?.complaints || []
  const totalComplaints = complaints.length
  const openComplaints = complaints.filter((c: any) => c.status === 'OPEN' || c.status === 'ASSIGNED').length
  const inProgressComplaints = complaints.filter((c: any) => c.status === 'IN PROGRESS').length
  const closedComplaints = complaints.filter((c: any) => c.status === 'CLOSED').length
  
  // Find complaints pending customer verification
  const pendingVerification = complaints.filter(
    (c: any) => c.customerVerificationStatus === 'PENDING'
  )

  // Show notification for pending verification
  useEffect(() => {
    if (pendingVerification.length > 0 && !verificationComplaint) {
      const complaint = pendingVerification[0]
      toast((t) => (
        <div className="flex flex-col">
          <span className="font-bold">Verification Required!</span>
          <span className="text-sm">Technician has closed your complaint. Please verify.</span>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              setVerificationComplaint(complaint)
            }}
            className="mt-2 bg-orange-500 text-white px-3 py-1 rounded text-sm"
          >
            Verify Now
          </button>
        </div>
      ), {
        duration: 10000,
        icon: '🔔'
      })
    }
  }, [pendingVerification, verificationComplaint])

  return (
    <Layout title="My Complaints">
      {/* Pending Verification Alert */}
      {pendingVerification.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="w-8 h-8 animate-bounce" />
              <div>
                <h3 className="text-xl font-bold">Verification Required!</h3>
                <p className="text-orange-100">
                  {pendingVerification.length} complaint(s) need your verification. 
                  Please confirm if the issue is resolved.
                </p>
              </div>
            </div>
            <button
              onClick={() => setVerificationComplaint(pendingVerification[0])}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Verify Now
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Total Complaints"
          value={totalComplaints}
          icon={FileText}
          color="blue"
        />
        <Card
          title="Pending"
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

      {/* Complaints Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Complaints History</h3>
        <ComplaintTable complaints={complaints} loading={isLoading} />
      </div>

      {/* Complaint Form Modal */}
      {showForm && <ComplaintForm onClose={() => setShowForm(false)} />}
      
      {/* Customer Verification Modal */}
      {verificationComplaint && (
        <CustomerVerificationModal
          complaint={verificationComplaint}
          onClose={() => setVerificationComplaint(null)}
        />
      )}
    </Layout>
  )
}

