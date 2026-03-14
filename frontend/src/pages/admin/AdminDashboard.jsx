import { useEffect, useState } from 'react'
import { Users, Building2, Droplets, CheckCircle, Clock, BarChart3, Shield, FileText } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'

const links = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/donors', label: 'Donors', icon: Droplets },
  { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/admin/requests', label: 'Blood Requests', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Donors', value: stats.totalDonors, icon: Droplets, color: 'text-blood-600 bg-blood-50', sub: `${stats.pendingDonors} pending approval` },
    { label: 'Hospitals', value: stats.totalHospitals, icon: Building2, color: 'text-blue-600 bg-blue-50', sub: `${stats.pendingHospitals} pending approval` },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50', sub: 'Registered users' },
    { label: 'Blood Requests', value: stats.totalRequests, icon: FileText, color: 'text-orange-600 bg-orange-50', sub: `${stats.fulfilledRequests} fulfilled` },
  ] : []

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blood-600" />
          <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500 mb-6">Full system overview and management</p>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(s => (
                <div key={s.label} className="card">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-display font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pending approvals alert */}
            {(stats.pendingDonors > 0 || stats.pendingHospitals > 0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Pending Approvals</p>
                  <p className="text-sm text-orange-600">
                    {stats.pendingDonors > 0 && `${stats.pendingDonors} donor${stats.pendingDonors>1?'s':''} waiting`}
                    {stats.pendingDonors > 0 && stats.pendingHospitals > 0 && ' · '}
                    {stats.pendingHospitals > 0 && `${stats.pendingHospitals} hospital${stats.pendingHospitals>1?'s':''} waiting`}
                  </p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { to: '/admin/donors', icon: Droplets, title: 'Manage Donors', desc: 'Approve, reject, and monitor all donors', badge: stats.pendingDonors, color: 'blood' },
                { to: '/admin/hospitals', icon: Building2, title: 'Manage Hospitals', desc: 'Approve hospitals and bootcamps', badge: stats.pendingHospitals, color: 'blue' },
                { to: '/admin/requests', icon: FileText, title: 'Blood Requests', desc: 'View all emergency blood requests', color: 'orange' },
                { to: '/admin/users', icon: Users, title: 'Manage Users', desc: 'View all registered users', color: 'purple' },
              ].map(item => (
                <a key={item.to} href={item.to} className="card hover:shadow-md transition-all flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${item.color}-50 text-${item.color}-600 flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      {item.badge > 0 && <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                    </div>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-500 text-xl">→</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
