import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Radio, Mail, Lock, ArrowRight } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const navigateByRole = (role: string) => {
    switch (role) {
      case 'customer': navigate('/customer'); break
      case 'technician': navigate('/technician'); break
      case 'manager': navigate('/manager'); break
      case 'staff': navigate('/staff'); break
      default: navigate('/')
    }
  }

  // Google Sign-In
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        })
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill'
          }
        )
      }
    }

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const googleAuthMutation = useMutation({
    mutationFn: authApi.googleAuth,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.technicianDetails)
      toast.success(`Welcome ${data.user.name}!`)
      navigateByRole(data.user.role)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Google sign-in failed')
    }
  })

  const handleGoogleResponse = (response: any) => {
    googleAuthMutation.mutate({ credential: response.credential })
  }

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.technicianDetails)
      toast.success(`Welcome ${data.user.name}!`)
      navigateByRole(data.user.role)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Fill all fields'); return }
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-4">
          <Radio className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">WaveFiber</h1>
        <p className="text-blue-200 text-sm mt-1">Cable Network Management</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage your complaints</p>

        {/* Google Sign-In Button */}
        <div className="mb-4">
          <div id="google-btn" className="flex justify-center"></div>
        </div>

        {googleAuthMutation.isPending && (
          <div className="text-center py-2 text-sm text-blue-600">Signing in with Google...</div>
        )}

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-gray-400">or</span>
          </div>
        </div>

        {/* Email/Password Toggle */}
        {!showEmailLogin ? (
          <button
            onClick={() => setShowEmailLogin(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl text-sm text-gray-700 font-medium active:bg-gray-50"
          >
            <Mail className="w-4 h-4" /> Sign in with Email
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" autoComplete="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" minLength={4} autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button type="submit" disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-base active:bg-blue-700 disabled:opacity-50">
              {loginMutation.isPending ? 'Signing in...' : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
            <button type="button" onClick={() => setShowEmailLogin(false)}
              className="w-full text-center text-sm text-gray-400 py-1">Cancel</button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-blue-300 mt-6">WaveFiber Cable Network</p>
    </div>
  )
}
