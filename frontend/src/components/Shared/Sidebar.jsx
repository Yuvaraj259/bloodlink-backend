import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ links, title }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, auth } = useAuth()

  const displayName = auth?.user?.name || auth?.donor?.name || auth?.hospital?.name || 'User'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-blood-50 overflow-hidden">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-red-100 flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-red-100 flex items-center gap-2">
          <Droplets className="text-blood-600 w-6 h-6" />
          <span className="font-display font-bold text-lg text-blood-700">BloodLink</span>
        </div>

        <div className="p-4 border-b border-red-100">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</div>
          <div className="font-semibold text-gray-800 truncate">{displayName}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`sidebar-link ${location.pathname === link.to ? 'active' : 'text-gray-600'}`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-red-100">
          <button onClick={handleLogout} className="sidebar-link text-gray-600 w-full">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-red-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Droplets className="text-blood-600 w-5 h-5" />
            <span className="font-display font-bold text-blood-700">BloodLink</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* This is where child content renders via outlet */}
        </main>
      </div>
    </div>
  )
}
