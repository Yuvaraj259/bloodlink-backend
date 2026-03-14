// Admin Requests
import { useEffect, useState } from 'react'
import { FileText, Droplets, Building2, Users, BarChart3, MapPin } from 'lucide-react'
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

const statusColors = {
  pending: 'bg-orange-100 text-orange-700',
  accepted: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    API.get('/admin/requests').then(r => setRequests(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Blood Requests</h1>
        <p className="text-gray-500 mb-6">All emergency blood requests in the system</p>

        <div className="card mb-6 flex flex-wrap gap-2">
          {['all','pending','accepted','fulfilled','cancelled'].map(s => (
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter===s?'bg-blood-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} requests</span>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r._id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge-blood">{r.bloodGroup}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>{r.status.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.urgency==='critical'?'bg-red-200 text-red-700':r.urgency==='urgent'?'bg-orange-100 text-orange-600':'bg-gray-100 text-gray-500'}`}>{r.urgency}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Patient: {r.patientName}</h3>
                    {r.requestedBy && <p className="text-sm text-gray-500">Requested by: {r.requestedBy.name} ({r.requestedBy.email})</p>}
                    {r.hospitalName && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{r.hospitalName}</p>}
                    {r.acceptedBy && <p className="text-sm text-green-700">✅ Accepted by: {r.acceptedBy.name} ({r.acceptedBy.bloodGroup}) — {r.acceptedBy.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(r.createdAt), 'dd MMM yyyy, hh:mm a')} · {r.notifiedDonors?.length || 0} donors notified
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="card text-center py-12 text-gray-400">No requests found</div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
