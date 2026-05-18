import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import MobileLayout from '../components/MobileLayout'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    block: user?.block || '',
    vcRId: user?.vcRId || ''
  })

  const updateMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      if (data?.user) { setUser(data.user); toast.success('Profile updated!') }
    },
    onError: () => toast.error('Failed to update profile')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <MobileLayout title="Profile">
      {/* Header card */}
      <div className="bg-blue-600 rounded-xl p-4 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-blue-200">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Full Name', name: 'name', type: 'text', required: true },
          { label: 'Phone', name: 'phone', type: 'tel', required: !user?.phone },
          { label: 'Address', name: 'address', type: 'text' },
          { label: 'Block', name: 'block', type: 'text' },
          { label: 'VC R-ID', name: 'vcRId', type: 'text' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
            <input type={field.type} value={(formData as any)[field.name]}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              required={field.required} />
          </div>
        ))}

        <button type="submit" disabled={updateMutation.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 disabled:opacity-50">
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 mt-6 py-3 border border-red-200 text-red-600 rounded-xl font-medium active:bg-red-50">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </MobileLayout>
  )
}
