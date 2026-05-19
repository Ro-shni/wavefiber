import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaints'
import Layout from '../components/Layout'
import ComplaintTable from '../components/ComplaintTable'
import { Search, Filter } from 'lucide-react'

export default function ManagerComplaints() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [blockFilter, setBlockFilter] = useState('')

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const complaints = complaintsData?.complaints || []

  // Apply filters
  const filteredComplaints = complaints.filter((c: any) => {
    const matchesSearch = 
      c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.complaintType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c._id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter ? c.status === statusFilter : true
    const matchesBlock = blockFilter ? c.block === blockFilter : true

    return matchesSearch && matchesStatus && matchesBlock
  })

  // Get unique blocks for filter dropdown
  const uniqueBlocks = Array.from(new Set(complaints.map((c: any) => c.block))).filter(Boolean)

  return (
    <Layout title="All Complaints">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <p className="text-slate-600">
          Manage and filter all network complaints from one central location.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Block Filter */}
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[120px]"
          >
            <option value="">All Blocks</option>
            {uniqueBlocks.map((block: any) => (
              <option key={block} value={block}>Block {block}</option>
            ))}
          </select>
        </div>
      </div>

      <ComplaintTable complaints={filteredComplaints} loading={isLoading} />
    </Layout>
  )
}
