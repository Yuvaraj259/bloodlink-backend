import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Droplets, Building2, FileText, Users, BarChart3, Check, X, Trash2, Search } from 'lucide-react'
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

export default function AdminDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchDonors = () => {
    API.get('/admin/donors').then(r => setDonors(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { fetchDonors() }, [])

  const approve = async (id) => {
    try { await API.put(`/admin/donors/${id}/approve`); toast.success('Donor approved!'); fetchDonors() }
    catch { toast.error('Failed') }
  }

  const reject = async (id) => {
    if (!confirm('Reject and remove this donor?')) return
    try { await API.put(`/admin/donors/${id}/reject`); toast.success('Donor rejected'); fetchDonors() }
    catch { toast.error('Failed') }
  }

  const deleteDonor = async (id) => {
    if (!confirm('Delete this donor permanently?')) return
    try { await API.delete(`/admin/donors/${id}`); toast.success('Deleted'); fetchDonors() }
    catch { toast.error('Failed') }
  }

  const filtered = donors.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()) || d.location?.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'pending' && !d.isApproved) || (filter === 'approved' && d.isApproved)
    return matchSearch && matchFilter
  })

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Donor Management</h1>
        <p className="text-gray-500 mb-6">Approve, manage, and monitor all registered donors</p>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search donors..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Donors</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>Total: <strong>{donors.length}</strong></span>
            <span>Pending: <strong className="text-orange-600">{donors.filter(d=>!d.isApproved).length}</strong></span>
            <span>Approved: <strong className="text-green-600">{donors.filter(d=>d.isApproved).length}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <div key={d._id} className={`card flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${!d.isApproved ? 'border-orange-200' : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blood-100 text-blood-700 font-bold flex items-center justify-center flex-shrink-0">
                    {d.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      <span className="badge-blood">{d.bloodGroup}</span>
                      {!d.isApproved && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                      {d.isHidden && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{d.email} · {d.phone}</p>
                    <p className="text-xs text-gray-400">{d.location?.city} · {d.registeredBy} · Joined {format(new Date(d.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!d.isApproved && (
                    <>
                      <button onClick={()=>approve(d._id)} className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={()=>reject(d._id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {d.isApproved && (
                    <button onClick={()=>deleteDonor(d._id)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="card text-center py-12 text-gray-400">No donors found</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
