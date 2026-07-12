import { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: number | string
  description?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'red' | 'amber'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    value: 'text-blue-900',
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    value: 'text-emerald-900',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    value: 'text-red-900',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    value: 'text-amber-900',
  },
}

 const StatsCard=({ label, value, description, icon, color }: StatsCardProps) =>{
  const colors = colorClasses[color]

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all hover:shadow-lg hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className={`text-3xl font-bold ${colors.value} mt-2`}>{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className={`${colors.icon} text-3xl`}>{icon}</div>
      </div>
    </div>
  )
}
export default StatsCard