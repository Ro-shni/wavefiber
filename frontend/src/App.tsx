import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import CustomerDashboard from './pages/CustomerDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'
import ComplaintDetails from './pages/ComplaintDetails'
import LeaveApproval from './pages/LeaveApproval'
import Profile from './pages/Profile'
import ChatList from './pages/ChatList'
import ChatPage from './pages/ChatPage'
import ManagerTechnicians from './pages/ManagerTechnicians'
import ManagerComplaints from './pages/ManagerComplaints'

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, token } = useAuthStore()
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

const RoleBasedRedirect = () => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  switch (user.role) {
    case 'customer':
      return <Navigate to="/customer" replace />
    case 'technician':
      return <Navigate to="/technician" replace />
    case 'manager':
      return <Navigate to="/manager" replace />
    case 'staff':
      return <Navigate to="/staff" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<RoleBasedRedirect />} />
        
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/manager/leave-approval"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <LeaveApproval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/technicians"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerTechnicians />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/complaints"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerComplaints />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/complaint/:id"
          element={
            <ProtectedRoute allowedRoles={['customer', 'technician', 'manager', 'staff']}>
              <ComplaintDetails />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['customer', 'technician']}>
              <ChatList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:complaintId"
          element={
            <ProtectedRoute allowedRoles={['customer', 'technician']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['customer', 'technician', 'manager', 'staff']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

