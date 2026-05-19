import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Radio, Mail, ArrowRight, Lock, Sparkles } from 'lucide-react'

// Load Google Sign-In script
declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

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
          callback: handleGoogleSignIn
        })
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { theme: 'outline', size: 'large', width: '100%' }
        )
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleNavigateAfterLogin = (role: string) => {
    switch (role) {
      case 'customer': navigate('/customer'); break;
      case 'technician': navigate('/technician'); break;
      case 'manager': navigate('/manager'); break;
      case 'staff': navigate('/staff'); break;
      default: navigate('/');
    }
  }

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.technicianDetails)
      toast.success(`Welcome ${data.user.name}!`)
      handleNavigateAfterLogin(data.user.role)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed')
    },
  })

  const googleAuthMutation = useMutation({
    mutationFn: authApi.googleAuth,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.technicianDetails)
      toast.success(`Welcome ${data.user.name}!`)
      handleNavigateAfterLogin(data.user.role)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Google sign-in failed')
    },
  })

  const handleGoogleSignIn = (response: any) => {
    googleAuthMutation.mutate({ credential: response.credential })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    if (!password || password.length < 4) {
      toast.error('Please enter a valid password')
      return
    }
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans">
      
      {/* Left side: Premium Branding/Image */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Animated gradient mesh background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 opacity-90 z-0"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse top-10 -left-20"></div>
        <div className="absolute w-[400px] h-[400px] bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse bottom-10 right-0"></div>
        
        {/* Content */}
        <div className="relative z-10 p-16 text-white max-w-2xl animate-slideInRight">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/20 shadow-2xl">
            <Radio className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Intelligent network management.
          </h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed mb-12">
            Streamline operations, resolve complaints faster, and deliver exceptional service to your customers with TCN's advanced platform.
          </p>
          
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-fit">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <p className="text-sm font-medium text-blue-50">Empowering 10,000+ connections</p>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative bg-white">
        {/* Subtle background pattern for the right side */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

        <div className="w-full max-w-md relative z-10 animate-fadeIn">
          
          {/* Mobile Header (Hidden on LG) */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">TCN</h1>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Google Sign-In */}
          <div className="mb-8">
            <div id="googleSignInButton" className="flex justify-center w-full"></div>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400 font-medium tracking-wide text-xs uppercase">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal"
                  minLength={4}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !email || password.length < 4}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-3.5 px-4 rounded-xl font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              <span>{loginMutation.isPending ? 'Signing in...' : 'Sign In'}</span>
              {!loginMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors">
              Create an account
            </a>
          </div>
          
        </div>
      </div>
    </div>
  )
}

