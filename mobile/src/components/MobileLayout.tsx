import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Home, MessageCircle, User, FileText } from 'lucide-react'

interface MobileLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
  hideNav?: boolean
}

export default function MobileLayout({ children, title, showBack, hideNav }: MobileLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const navItems = user?.role === 'technician'
    ? [
        { icon: Home, label: 'Home', path: '/technician' },
        { icon: FileText, label: 'Complaints', path: '/technician' },
        { icon: MessageCircle, label: 'Chat', path: '/messages' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: Home, label: 'Home', path: '/customer' },
        { icon: FileText, label: 'Complaints', path: '/customer' },
        { icon: MessageCircle, label: 'Chat', path: '/messages' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top bar */}
      {title && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="text-gray-600 text-lg">
              &larr;
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        </header>
      )}

      {/* Content */}
      <main className="px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/messages' && location.pathname.startsWith('/chat'))
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center px-3 py-1 ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs mt-0.5">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
