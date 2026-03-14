import { useEffect, useState } from 'react'
import { Phone, MapPin, Building2, Search, Droplets, Clock, Heart } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'

const links = [
  { to: '/user', label: 'Dashboard', icon: Droplets },
  { to: '/user/search', label: 'Search Donors', icon: Search },
  { to: '/user/emergency', label: 'Emergency Centers', icon: Building2 },
  { to: '/user/requests', label: 'My Requests', icon: Clock },
  { to: '/user/profile', label: 'My Profile', icon: Heart },
]

export default function EmergencyDashboard() {
  const [hospitals, setHospitals] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/hospitals').then(r => setHospitals(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || h.type === filter
    return matchSearch && matchFilter
  })

  return (
    <DashboardLayout links={links} portalLabel="User">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-red-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Emergency Centers</h1>
        </div>
        <p className="text-gray-500 mb-6 ml-13">Hospitals and blood bootcamps you can contact during emergencies</p>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search by name or city..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="hospital">Hospitals</option>
              <option value="bootcamp">Blood Bootcamps</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No centers found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(h => (
              <div key={h._id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.type==='hospital'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                        {h.type === 'hospital' ? '🏥 Hospital' : '🩸 Bootcamp'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{h.name}</h3>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blood-400" />
                    <span>{h.address}, {h.city}{h.state ? `, ${h.state}` : ''} {h.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 flex-shrink-0 text-blood-400" />
                    <a href={`tel:${h.phone}`} className="text-blood-600 font-medium hover:underline">{h.phone}</a>
                  </div>
                  {h.contactPerson && (
                    <div className="text-sm text-gray-500">Contact: {h.contactPerson}</div>
                  )}
                </div>

                <a href={`tel:${h.phone}`} className="btn-primary text-center block text-sm py-2">
                  📞 Call Now
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
