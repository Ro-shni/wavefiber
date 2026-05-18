import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import Layout from '../components/Layout'
import { User, Phone, Mail, MapPin, Building2, CreditCard, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    block: user?.block || '',
    vcRId: user?.vcRId || ''
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await authApi.updateProfile(data)
        console.log('✅ Raw API response:', response)
        return response
      } catch (error: any) {
        console.error('❌ API Error:', error)
        console.error('❌ Error response:', error.response)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success data:', data)
      // The API returns response.data directly
      if (data && data.user) {
        setUser(data.user)
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        toast.success(data.message || 'Profile updated successfully!')
      } else {
        console.error('❌ Invalid data format:', data)
        toast.error('Profile updated but response format is unexpected')
      }
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error)
      console.error('❌ Error response data:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
      toast.error(errorMessage)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number if provided
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Phone number must be 10 digits')
      return
    }

    updateProfileMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const isPhoneRequired = !user?.phone

  return (
    <Layout title="My Profile">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                <p className="text-blue-100">{user?.email}</p>
                <div className="mt-1">
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Email Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alert for phone number requirement */}
          {isPhoneRequired && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-8 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Phone className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Phone number required!</strong> You must add your phone number before filing any complaints.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number {isPhoneRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                placeholder="10-digit phone number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isPhoneRequired ? 'border-red-300' : 'border-gray-300'
                }`}
                required={isPhoneRequired}
              />
              {isPhoneRequired && (
                <p className="mt-1 text-sm text-red-600">
                  Phone number is required to file complaints
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full address"
              />
            </div>

            {/* Block */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Block
              </label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A1, B2, C3"
              />
            </div>

            {/* VC R-ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                VC R-ID
              </label>
              <input
                type="text"
                name="vcRId"
                value={formData.vcRId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your VC R-ID"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Role Info */}
        <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Role:</strong> {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
            <p><strong>Account Created:</strong> Member since {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

