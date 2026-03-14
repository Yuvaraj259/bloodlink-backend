import { useEffect, useState } from 'react'
import { Users, Droplets, Building2, FileText, BarChart3, Search } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'
import { format } from 'date-fns'

const links = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/donors', label: 'Donors', icon: Droplets },
  { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/admin/requests', label: 'Blood Requests', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    API.get('/admin/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.location?.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-500 mb-6">All registered users in the system</p>

        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <p className="text-sm text-gray-400 mt-2">{filtered.length} of {users.length} users</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(u => (
              <div key={u._id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      {u.bloodGroup && <span className="badge-blood text-xs">{u.bloodGroup}</span>}
                    </div>
                    <p className="text-sm text-gray-500">{u.email} · {u.phone}</p>
                    <p className="text-xs text-gray-400">{u.location?.city} · Joined {format(new Date(u.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">User</span>
              </div>
            ))}
            {filtered.length === 0 && <div className="card text-center py-12 text-gray-400">No users found</div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
