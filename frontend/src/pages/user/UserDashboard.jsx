import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertTriangle, Building2, Clock, Droplets, Heart } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

const links = [
  { to: '/user', label: 'Dashboard', icon: Droplets },
  { to: '/user/search', label: 'Search Donors', icon: Search },
  { to: '/user/emergency', label: 'Emergency Centers', icon: Building2 },
  { to: '/user/requests', label: 'My Requests', icon: Clock },
  { to: '/user/profile', label: 'My Profile', icon: Heart },
]

export default function UserDashboard() {
  const { auth } = useAuth()
  const [requests, setRequests] = useState([])
  const user = auth?.user

  useEffect(() => {
    API.get('/requests/my').then(r => setRequests(r.data)).catch(() => {})
  }, [])

  const pending = requests.filter(r => r.status === 'pending').length
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length

  return (
    <DashboardLayout links={links} portalLabel="User">
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Find donors, send requests, track your blood needs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: requests.length, color: 'text-blood-600 bg-blood-50', icon: Droplets },
            { label: 'Pending', value: pending, color: 'text-orange-600 bg-orange-50', icon: Clock },
            { label: 'Fulfilled', value: fulfilled, color: 'text-green-600 bg-green-50', icon: Heart },
            { label: 'Blood Group', value: user?.bloodGroup || '—', color: 'text-purple-600 bg-purple-50', icon: Droplets },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold font-display text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/user/search" className="card hover:shadow-md transition-all group border-blood-200 hover:border-blood-400 text-center">
              <div className="w-14 h-14 bg-blood-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blood-200 transition-colors">
                <Search className="w-7 h-7 text-blood-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Search Donors</h3>
              <p className="text-sm text-gray-500 mt-1">Find donors by blood type & location</p>
            </Link>
            <Link to="/user/emergency" className="card hover:shadow-md transition-all group border-orange-200 hover:border-orange-400 text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                <Building2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Emergency Centers</h3>
              <p className="text-sm text-gray-500 mt-1">Hospitals & blood banks near you</p>
            </Link>
            <Link to="/user/requests" className="card hover:shadow-md transition-all group border-green-200 hover:border-green-400 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <Clock className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">My Requests</h3>
              <p className="text-sm text-gray-500 mt-1">Track your blood requests</p>
            </Link>
          </div>
        </div>

        {/* Recent requests */}
        {requests.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Recent Requests</h2>
            <div className="space-y-3">
              {requests.slice(0, 5).map(req => (
                <div key={req._id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="badge-blood">{req.bloodGroup}</span>
                    <div>
                      <p className="font-medium text-gray-900">{req.patientName}</p>
                      <p className="text-sm text-gray-500">{req.hospitalName || 'No hospital specified'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    req.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                    req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                    req.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{req.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
