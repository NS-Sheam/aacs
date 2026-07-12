export const getStatusColor=(status: string): string=> {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'queued':
      return 'bg-slate-100 text-slate-800 border-slate-300'
    case 'error':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}