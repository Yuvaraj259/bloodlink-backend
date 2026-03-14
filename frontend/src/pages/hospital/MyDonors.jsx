import { useEffect, useState } from 'react'
import { Users, UserPlus, Award, Building2, BarChart3, Search, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'

const links = [
  { to: '/hospital', label: 'Dashboard', icon: BarChart3 },
  { to: '/hospital/register-donor', label: 'Register Donor', icon: UserPlus },
  { to: '/hospital/donors', label: 'My Donors', icon: Users },
  { to: '/hospital/certificates', label: 'Upload Certificate', icon: Award },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

export default function MyDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBlood, setFilterBlood] = useState('')

  useEffect(() => {
    API.get('/hospitals/my-donors').then(r => setDonors(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = donors.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) || d.location?.city?.toLowerCase().includes(search.toLowerCase())
    const matchBlood = !filterBlood || d.bloodGroup === filterBlood
    return matchSearch && matchBlood
  })

  return (
    <DashboardLayout links={links} portalLabel="Hospital">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">My Donors</h1>
        <p className="text-gray-500 mb-6">All donors registered by your facility</p>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search by name or city..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filterBlood} onChange={e=>setFilterBlood(e.target.value)}>
              <option value="">All Blood Groups</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No donors found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => (
              <div key={d._id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blood-100 text-blood-700 font-bold flex items-center justify-center">
                      {d.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.gender} · Age {d.age}</p>
                    </div>
                  </div>
                  <span className="badge-blood">{d.bloodGroup}</span>
                </div>

                <div className="space-y-1 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{d.location?.city || '—'}</div>
                  <div>📞 {d.phone}</div>
                  <div>📧 {d.email}</div>
                  <div>💉 Donations: {d.donationHistory?.length || 0}</div>
                </div>

                <div className="flex gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.isAvailable && !d.isHidden ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {d.isHidden ? 'Hidden (donated)' : d.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  {d.isApproved && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Approved</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
