import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Building2, Droplets, FileText, Users, BarChart3, Check, X, Search, Phone, MapPin } from 'lucide-react'
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

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchHospitals = () => {
    API.get('/admin/hospitals').then(r => setHospitals(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }

  useEffect(() => { fetchHospitals() }, [])

  const approve = async (id) => {
    try { await API.put(`/admin/hospitals/${id}/approve`); toast.success('Hospital approved!'); fetchHospitals() }
    catch { toast.error('Failed') }
  }

  const reject = async (id) => {
    if (!confirm('Reject and remove this hospital?')) return
    try { await API.put(`/admin/hospitals/${id}/reject`); toast.success('Rejected'); fetchHospitals() }
    catch { toast.error('Failed') }
  }

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'pending' && !h.isApproved) || (filter === 'approved' && h.isApproved) || (filter === h.type)
    return matchSearch && matchFilter
  })

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Hospital & Bootcamp Management</h1>
        <p className="text-gray-500 mb-6">Approve and manage partner organizations</p>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search organizations..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="hospital">Hospitals Only</option>
              <option value="bootcamp">Bootcamps Only</option>
            </select>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>Total: <strong>{hospitals.length}</strong></span>
            <span>Pending: <strong className="text-orange-600">{hospitals.filter(h=>!h.isApproved).length}</strong></span>
            <span>Approved: <strong className="text-green-600">{hospitals.filter(h=>h.isApproved).length}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(h => (
              <div key={h._id} className={`card flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${!h.isApproved ? 'border-orange-200' : ''}`}>
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
                    {h.type === 'hospital' ? '🏥' : '🩸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900">{h.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.type==='hospital'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                        {h.type}
                      </span>
                      {!h.isApproved && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{h.city}{h.state?`, ${h.state}`:''}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{h.phone}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{h.email} · Applied {format(new Date(h.createdAt), 'dd MMM yyyy')}</p>
                    {h.contactPerson && <p className="text-xs text-gray-400">Contact: {h.contactPerson}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!h.isApproved && (
                    <>
                      <button onClick={()=>approve(h._id)} className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={()=>reject(h._id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {h.isApproved && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" /> Active
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="card text-center py-12 text-gray-400">No organizations found</div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
