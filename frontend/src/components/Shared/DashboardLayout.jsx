import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, Menu, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout({ children, links, portalLabel }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, auth } = useAuth()

  const displayName = auth?.user?.name || auth?.donor?.name || auth?.hospital?.name || 'User'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen bg-blood-50 font-body overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg border-r border-red-100 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-red-100">
          <div className="w-8 h-8 bg-blood-600 rounded-lg flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-blood-700">BloodLink</span>
        </div>

        {/* Portal label + user */}
        <div className="px-6 py-4 border-b border-red-50 bg-blood-50">
          <div className="text-xs font-semibold text-blood-500 uppercase tracking-widest mb-1">{portalLabel}</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blood-600 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
            <span className="text-sm font-medium text-gray-800 truncate">{displayName}</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blood-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-blood-50 hover:text-blood-700'
                }`}
              >
                <link.icon className="w-4 h-4 flex-shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-red-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-red-100 px-4 lg:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-blood-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-sm text-gray-400">{portalLabel} Portal</h1>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-blood-100 text-blood-700 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
