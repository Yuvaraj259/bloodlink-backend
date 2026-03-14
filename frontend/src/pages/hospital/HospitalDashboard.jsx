import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserPlus, Award, Building2, BarChart3, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

const links = [
  { to: '/hospital', label: 'Dashboard', icon: BarChart3 },
  { to: '/hospital/register-donor', label: 'Register Donor', icon: UserPlus },
  { to: '/hospital/donors', label: 'My Donors', icon: Users },
  { to: '/hospital/certificates', label: 'Upload Certificate', icon: Award },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

export default function HospitalDashboard() {
  const { auth } = useAuth()
  const hospital = auth?.hospital
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/hospitals/my-donors').then(r => setDonors(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Donors Registered', value: donors.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Donations with Certs', value: donors.filter(d => d.donationHistory?.some(h => h.certificateUrl)).length, icon: Award, color: 'text-purple-600 bg-purple-50' },
    { label: 'Available Donors', value: donors.filter(d => d.isAvailable && !d.isHidden).length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Organization Type', value: hospital?.type === 'hospital' ? '🏥 Hospital' : '🩸 Bootcamp', icon: Building2, color: 'text-blood-600 bg-blood-50' },
  ]

  return (
    <DashboardLayout links={links} portalLabel={hospital?.type === 'hospital' ? 'Hospital' : 'Bootcamp'}>
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Welcome, {hospital?.name}</h1>
        <p className="text-gray-500 mb-6">Manage your blood donors and donation records</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link to="/hospital/register-donor" className="card hover:shadow-md transition-all text-center group">
            <UserPlus className="w-10 h-10 text-blood-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Register New Donor</h3>
            <p className="text-sm text-gray-500 mt-1">Add a donor who came to donate</p>
          </Link>
          <Link to="/hospital/donors" className="card hover:shadow-md transition-all text-center group">
            <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">View My Donors</h3>
            <p className="text-sm text-gray-500 mt-1">Manage all registered donors</p>
          </Link>
          <Link to="/hospital/certificates" className="card hover:shadow-md transition-all text-center group">
            <Award className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Issue Certificate</h3>
            <p className="text-sm text-gray-500 mt-1">Generate or upload certificates</p>
          </Link>
        </div>

        {/* Recent donors */}
        {donors.slice(0, 5).length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Recently Registered Donors</h2>
            <div className="space-y-3">
              {donors.slice(0, 5).map(d => (
                <div key={d._id} className="card flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blood-100 text-blood-700 font-bold flex items-center justify-center text-sm">
                      {d.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.location?.city}</p>
                    </div>
                  </div>
                  <span className="badge-blood">{d.bloodGroup}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
