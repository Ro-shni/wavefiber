import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { techniciansApi } from '../api/technicians'
import { complaintsApi } from '../api/complaints'
import Layout from '../components/Layout'
import { SimpleCard } from '../components/Card'
import { 
  Users, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react'

export default function ManagerTechnicians() {
  const navigate = useNavigate()
  const [filterBlock, setFilterBlock] = useState<string>('')

  const { data: techniciansData, isLoading: techLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansApi.getAll(),
  })

  const { data: complaintsData, isLoading: compLoading } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: () => complaintsApi.getAll(),
  })

  const technicians = techniciansData?.technicians || []
  const allComplaints = complaintsData?.complaints || []

  // Filter technicians by block if needed
  const filteredTechnicians = filterBlock 
    ? technicians.filter((t: any) => t.block === filterBlock)
    : technicians

  // Group complaints by technician
  const getActiveWorkload = (technicianId: string) => {
    return allComplaints.filter((c: any) => 
      c.technicianId?._id === technicianId && 
      ['ASSIGNED', 'IN PROGRESS'].includes(c.status)
    )
  }

  // Calculate time elapsed
  const getElapsedTime = (assignedAt: string) => {
    const start = new Date(assignedAt).getTime()
    const now = new Date().getTime()
    const diffMins = Math.floor((now - start) / 60000)
    
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Layout title="Technicians Tracking">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-slate-600">
          Monitor your technicians, their availability, and active work progress.
        </p>
        
        {/* Filter */}
        <select
          value={filterBlock}
          onChange={(e) => setFilterBlock(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
        >
          <option value="">All Blocks</option>
          {Array.from(new Set(technicians.map((t: any) => t.block))).map(block => (
            <option key={block as string} value={block as string}>Block {block as string}</option>
          ))}
        </select>
      </div>

      {(techLoading || compLoading) ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTechnicians.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Technicians Found</h3>
          <p className="text-slate-500">There are no technicians available for the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTechnicians.map((tech: any) => {
            const activeComplaints = getActiveWorkload(tech._id)
            
            return (
              <SimpleCard key={tech._id} className="flex flex-col h-full border-t-4 border-t-blue-500">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl uppercase">
                      {tech.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{tech.name}</h3>
                      <div className="flex items-center text-sm text-slate-500 gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Block {tech.block}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {tech.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    tech.onLeave 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : !tech.isAvailable 
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : activeComplaints.length > 0 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {tech.onLeave ? 'ON LEAVE' : !tech.isAvailable ? 'OFFLINE' : activeComplaints.length > 0 ? 'BUSY' : 'AVAILABLE'}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">Active</p>
                    <p className="text-xl font-bold text-blue-600">{activeComplaints.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">Closed</p>
                    <p className="text-xl font-bold text-green-600">{tech.totalComplaintsClosed}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">Avg Time</p>
                    <p className="text-xl font-bold text-slate-700">
                      {tech.averageResolutionTime ? `${Math.round(tech.averageResolutionTime)}m` : '-'}
                    </p>
                  </div>
                </div>

                {/* Active Workload List */}
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Current Workload
                  </h4>
                  
                  {activeComplaints.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No active complaints at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeComplaints.map((complaint: any) => (
                        <div 
                          key={complaint._id}
                          onClick={() => navigate(`/complaint/${complaint._id}`)}
                          className="group p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${complaint.status === 'IN PROGRESS' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                                <span className="font-semibold text-slate-900 text-sm">{complaint.complaintType}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{complaint.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 mt-1" />
                          </div>
                          <div className="mt-3 flex justify-between items-center text-xs">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                              {complaint.status}
                            </span>
                            {complaint.assignedAt && (
                              <span className="text-red-500 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {getElapsedTime(complaint.assignedAt)} elapsed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SimpleCard>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
