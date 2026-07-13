import { SubmissionStatus } from '@/types'
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface StatusBadgeProps {
  status: SubmissionStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfigs: Record<
  SubmissionStatus,
  {
    label: string
    bg: string
    text: string
    border: string
    icon: typeof CheckCircle2
  }
> = {
  queued: {
    label: 'Queued',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  active: {
    label: 'Active',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2 ,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  error: {
    label: 'Error',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
  },
}

 const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const config = statusConfigs[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon className={`${iconSizes[size]} ${status === 'active' ? 'animate-spin' : ''}`} />
      {config.label}
    </div>
  )
}

export default StatusBadge