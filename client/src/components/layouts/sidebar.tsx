'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, Upload, CheckCircle, Download, Menu, X, ClipboardList } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, description: 'Overview & stats' },
  { href: '/upload', label: 'Upload', icon: Upload, description: 'New assignment' },
  { href: '/review', label: 'Review Queue', icon: CheckCircle, description: 'Pending approval' },
  { href: '/export', label: 'Export', icon: Download, description: 'Download results' },
]

 const Sidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 shadow-xl transform transition-transform duration-300 ease-in-out z-40 md:z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 md:hidden p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col h-full pt-6 pb-6">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-6 mb-8 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">AACS</h1>
              <p className="text-xs text-slate-400">Programming Hero</p>
            </div>
          </Link>

          <nav className="flex-1 px-3 space-y-2">
            {navItems.map(({ href, label, icon: Icon, description }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-blue-600/80 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-blue-200' : 'group-hover:text-blue-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${isActive ? 'text-white' : ''}`}>{label}</p>
                    <p className={`text-xs leading-tight ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                      {description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>

         
        </div>
      </aside>

      <div className="hidden md:block md:w-64" />
    </>
  )
}
export default Sidebar