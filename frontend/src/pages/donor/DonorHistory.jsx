import { useEffect, useState } from 'react'
import { Clock, Award, User, Heart, Bell, Droplets } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'
import { format } from 'date-fns'

const links = [
  { to: '/donor', label: 'Dashboard', icon: Droplets },
  { to: '/donor/profile', label: 'My Profile', icon: User },
  { to: '/donor/history', label: 'Donation History', icon: Clock },
  { to: '/donor/certificates', label: 'Certificates', icon: Award },
  { to: '/donor/requests', label: 'Blood Requests', icon: Bell },
]

export default function DonorHistory() {
  const [data, setData] = useState({ donationHistory: [], name: '', bloodGroup: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/donors/history').then(r => setData(r.data || {})).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout links={links} portalLabel="Donor">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Donation History</h1>
        <p className="text-gray-500 mb-6">All your blood donations — every drop counts!</p>

        {loading ? <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        : data.donationHistory?.length === 0 ? (
          <div className="card text-center py-16">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No donations yet</p>
            <p className="text-gray-400 text-sm mt-1">Your donation history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.donationHistory.map((h, i) => (
              <div key={i} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blood-100 text-blood-700 font-bold text-lg flex items-center justify-center">
                    {i+1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{h.hospitalName || 'Hospital'}</p>
                    <p className="text-sm text-gray-500">{format(new Date(h.date), 'dd MMMM yyyy')}</p>
                    {h.registeredByType && <p className="text-xs text-gray-400">Registered by: {h.registeredByType}</p>}
                  </div>
                </div>
                {h.certificateUrl ? (
                  <a href={h.certificateUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                    <Award className="w-4 h-4" /> Certificate
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No certificate</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
