import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import toast from 'react-hot-toast'
import { Radio, Phone, ArrowRight, Lock, Mail, User, MapPin, Home } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  
  // Common fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'technician'>('customer')
  
  // Dynamic fields
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [block, setBlock] = useState('')
  const [vcRId, setVcRId] = useState('')

  const signupMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success(`Account created successfully! Welcome ${data.user.name}`)
      navigate('/login')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Signup failed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || name.length < 2) {
      toast.error('Please enter a valid name (min 2 characters)')
      return
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }

    if (role === 'technician') {
      if (!phone || phone.length !== 10) {
        toast.error('Phone number (10 digits) is required for technicians')
        return
      }
      if (!block) {
        toast.error('Block is required for technicians')
        return
      }
    } else if (phone && phone.length !== 10) {
      toast.error('Phone number must be 10 digits')
      return
    }

    signupMutation.mutate({
      name,
      email,
      password,
      phone: phone || undefined,
      role,
      address: address || undefined,
      block: block || undefined,
      vcRId: vcRId || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <Radio className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-sm text-gray-600">Join TCN Network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  role === 'customer' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('technician')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  role === 'technician' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Technician
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You can sign in later using Google or this email
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number {role === 'technician' ? <span className="text-red-500">*</span> : '(Optional)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={10}
                  required={role === 'technician'}
                />
              </div>
            </div>

            {/* Conditional fields for Customer / Technician */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block {role === 'technician' ? <span className="text-red-500">*</span> : '(Optional)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g., A1, B2"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={role === 'technician'}
                  />
                </div>
              </div>

              {role === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VC R ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={vcRId}
                    onChange={(e) => setVcRId(e.target.value)}
                    placeholder="VC1001"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {role === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full address"
                    rows={2}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={4}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={4}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>{signupMutation.isPending ? 'Creating Account...' : 'Create Account'}</span>
              {!signupMutation.isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          © 2024 TCN. All rights reserved.
        </div>
      </div>
    </div>
  )
}

