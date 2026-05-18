import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'
import CustomerDashboard from './pages/CustomerDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import ComplaintDetails from './pages/ComplaintDetails'
import ChatList from './pages/ChatList'
import ChatPage from './pages/ChatPage'
import Profile from './pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
})

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'customer': return <Navigate to="/customer" replace />
    case 'technician': return <Navigate to="/technician" replace />
    default: return <Navigate to="/customer" replace />
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute roles={['technician']}><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/complaint/:id" element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute roles={['customer', 'technician']}><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:complaintId" element={<ProtectedRoute roles={['customer', 'technician']}><ChatPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
    </QueryClientProvider>
  )
}
