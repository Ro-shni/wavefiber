import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  phone?: string
  email?: string
  role: 'customer' | 'technician' | 'manager' | 'staff'
  address?: string
  block?: string
  vcRId?: string
  isEmailVerified?: boolean
}

interface TechnicianDetails {
  _id: string
  name: string
  phone: string
  block: string
  isAvailable: boolean
  onLeave: boolean
  currentWorkload: number
  totalComplaintsHandled: number
  totalComplaintsClosed: number
  averageResolutionTime: number
}

interface AuthState {
  user: User | null
  token: string | null
  technicianDetails: TechnicianDetails | null
  setAuth: (user: User, token: string, technicianDetails?: TechnicianDetails) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      technicianDetails: null,
      setAuth: (user, token, technicianDetails) => set({ user, token, technicianDetails }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null, technicianDetails: null }),
    }),
    { name: 'wf-mobile-auth' }
  )
)
