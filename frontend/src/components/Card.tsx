import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  subtitle?: string
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 shadow-blue-500/20',
  green: 'bg-green-50 text-green-600 shadow-green-500/20',
  yellow: 'bg-yellow-50 text-yellow-600 shadow-yellow-500/20',
  red: 'bg-red-50 text-red-600 shadow-red-500/20',
  purple: 'bg-purple-50 text-purple-600 shadow-purple-500/20',
}

const iconGradients = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  yellow: 'from-amber-400 to-amber-500',
  red: 'from-rose-400 to-rose-600',
  purple: 'from-purple-500 to-purple-600',
}

export default function Card({ title, value, icon: Icon, color = 'blue', subtitle }: CardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover-lift relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${iconGradients[color]} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs font-medium text-slate-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl shadow-lg ${colorClasses[color]} bg-gradient-to-br transition-transform group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

interface SimpleCardProps {
  children: ReactNode
  className?: string
}

export function SimpleCard({ children, className = '' }: SimpleCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 hover-lift ${className}`}>
      {children}
    </div>
  )
}

