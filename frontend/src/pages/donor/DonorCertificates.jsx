import { useEffect, useState } from 'react'
import { Award, Download, User, Clock, Bell, Droplets } from 'lucide-react'
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

export default function DonorCertificates() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/certificates/my').then(r => setCerts(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout links={links} portalLabel="Donor">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-500 mb-6">Download your digital blood donation certificates</p>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : certs.length === 0 ? (
          <div className="card text-center py-16">
            <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No certificates yet</p>
            <p className="text-gray-400 text-sm mt-1">Certificates are issued by hospitals/bootcamps after donation</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.filter(c => c.certificateUrl).map((c, i) => (
              <div key={i} className="card border-purple-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Donation Certificate</p>
                    <p className="text-xs text-gray-500">#{i + 1}</p>
                  </div>
                </div>
                <div className="space-y-1 mb-6 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Issued by:</span><span className="font-semibold text-gray-900">{c.hospitalName || 'Blood Center'}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Date:</span><span className="font-semibold text-gray-900">{format(new Date(c.date), 'dd MMM yyyy')}</span></div>
                </div>
                
                <div className="flex gap-2">
                  <a href={c.certificateUrl} target="_blank" rel="noreferrer" 
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-100">
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <button onClick={() => {navigator.clipboard.writeText(c.certificateUrl); toast.success('Link copied!')}} 
                    className="p-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors" title="Copy Link">
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
