import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, Radio, User, MessageCircle, FileText, LayoutDashboard } from 'lucide-react'
import NotificationPanel from './NotificationPanel'

interface LayoutProps {
  children: ReactNode
  title: string
}

export default function Layout({ children, title }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isMessagesPage = location.pathname.includes('/messages')

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V.5H32" fill="none" stroke="currentColor" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo area */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight leading-none">TCN</h1>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 tracking-wide uppercase mt-0.5">Wavefiber Network</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              {(user?.role === 'customer' || user?.role === 'technician') && (
                <button
                  onClick={() => navigate('/messages')}
                  className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 ${
                    isMessagesPage 
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                      : 'text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Messages</span>
                </button>
              )}

              {user?.role === 'manager' && (
                <>
                  <button
                    onClick={() => navigate('/manager')}
                    className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 ${
                      location.pathname === '/manager'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                        : 'text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>

                  <button
                    onClick={() => navigate('/manager/complaints')}
                    className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 ${
                      location.pathname.includes('/manager/complaints')
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                        : 'text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">Complaints</span>
                  </button>

                  <button
                    onClick={() => navigate('/manager/technicians')}
                    className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 ${
                      location.pathname.includes('/manager/technicians')
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                        : 'text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">Technicians</span>
                  </button>
                </>
              )}
              
              <div className="relative z-50">
                <NotificationPanel />
              </div>

              {/* User Profile Menu */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 bg-white/50 hover:bg-white border border-slate-200/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-700">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[11px] font-medium text-slate-500 capitalize tracking-wide">{user?.role}</p>
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 sm:px-4 sm:py-2 flex items-center space-x-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">{title}</h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full mt-3"></div>
          </div>
        </div>
        
        {/* Child Views */}
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

