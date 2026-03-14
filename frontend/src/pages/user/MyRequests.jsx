import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Clock, CheckCircle, MapPin, Droplets, Search, Building2, Heart } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'
import { format } from 'date-fns'
import { useSocket } from '../../context/SocketContext'

const links = [
  { to: '/user', label: 'Dashboard', icon: Droplets },
  { to: '/user/search', label: 'Search Donors', icon: Search },
  { to: '/user/emergency', label: 'Emergency Centers', icon: Building2 },
  { to: '/user/requests', label: 'My Requests', icon: Clock },
  { to: '/user/profile', label: 'My Profile', icon: Heart },
]

const statusColors = {
  pending: 'bg-orange-100 text-orange-700',
  accepted: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveLocations, setLiveLocations] = useState({}) // { requestId: { lat, lng } }

  const fetchRequests = () => {
    API.get('/requests/my').then(r => setRequests(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, [])

  // Update requests list when a donor accepts via socket (including SMS accept)
  const socketRef = useSocket()
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const updateRequestAccepted = (data) => {
      console.log('[MyRequests] Processing acceptance data:', data)
      const { requestId, donor, location } = data;

      if (requestId) {
        setRequests(prev => prev.map(req => {
          if (req._id === requestId) {
            return {
              ...req,
              status: 'accepted',
              acceptedBy: donor || req.acceptedBy,
              acceptedAt: new Date(),
              donorLocation: location || req.donorLocation
            }
          }
          return req;
        }));

        if (location) {
          setLiveLocations(prev => ({ ...prev, [requestId]: location }))
        }
        toast.success('🎉 A donor has accepted your request!')
      }
      fetchRequests()
    }

    socket.on('donor_accepted', updateRequestAccepted)

    // Add listeners for specific requests in the list
    requests.forEach(req => {
      socket.on(`request_accepted_${req._id}`, updateRequestAccepted)
    })

    return () => {
      socket.off('donor_accepted', updateRequestAccepted)
      requests.forEach(req => {
        socket.off(`request_accepted_${req._id}`)
      })
    }
  }, [socketRef, requests.length])

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const activeRequests = requests.filter(r => r.status === 'accepted')

    activeRequests.forEach(req => {
      socket.on(`location_updated_${req._id}`, ({ location }) => {
        setLiveLocations(prev => ({ ...prev, [req._id]: location }))
      })
    })

    return () => {
      activeRequests.forEach(req => {
        socket.off(`location_updated_${req._id}`)
      })
    }
  }, [socketRef, requests])

  const approveDonation = async (requestId) => {
    try {
      await API.post(`/requests/${requestId}/fulfill`)
      toast.success('Donation approved! Donor hidden for 3 months.')
      fetchRequests()
    } catch { toast.error('Failed to approve') }
  }

  return (
    <DashboardLayout links={links} portalLabel="User">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">My Blood Requests</h1>
        <p className="text-gray-500 mb-6">Track all your emergency blood requests</p>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : requests.length === 0 ? (
          <div className="card text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests yet. Search donors and send a request!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req._id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge-blood text-base px-3 py-1">{req.bloodGroup}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[req.status]}`}>
                        {req.status.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${req.urgency === 'critical' ? 'bg-red-200 text-red-800' : req.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {req.urgency}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{req.patientName}</h3>
                    {req.hospitalName && <p className="text-sm text-gray-500 mb-1">🏥 {req.hospitalName}</p>}
                    {req.message && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-2">"{req.message}"</p>}
                    <p className="text-xs text-gray-400">{format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                    <p className="text-xs text-gray-400 mt-1">Notified {req.notifiedDonors?.length || 0} donors</p>
                  </div>

                  <div className="lg:text-right space-y-3">
                    {req.status === 'accepted' && req.acceptedBy && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-500 mb-1 font-medium">DONOR ACCEPTED</p>
                        <p className="font-semibold text-gray-900">{req.acceptedBy.name}</p>
                        <p className="text-sm text-blood-600 font-bold">{req.acceptedBy.bloodGroup}</p>
                        <p className="text-sm text-gray-600">{req.acceptedBy.phone}</p>
                        {(() => {
                          const currentLoc = liveLocations[req._id] || req.donorLocation
                          if (!currentLoc?.lat || !currentLoc?.lng) return null

                          return (
                            <div className="flex flex-col gap-2 mt-2 bg-white/50 p-3 rounded-xl border border-blue-100 shadow-sm">
                              <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                                </span>
                                LIVE TRACKING ACTIVE
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <a href={`https://www.google.com/maps/search/?api=1&query=${currentLoc.lat},${currentLoc.lng}`}
                                  target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold hover:text-blue-700">
                                  Track Donor on Map
                                </a>
                              </div>
                              <p className="text-[10px] text-gray-400">Location updates automatically as donor moves</p>
                            </div>
                          )
                        })()}
                        <button onClick={() => approveDonation(req._id)}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                          Approve Donation Received
                        </button>
                      </div>
                    )}
                    {req.status === 'fulfilled' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-green-700 font-medium">Donation Complete</p>
                        <p className="text-xs text-green-500">{req.fulfilledAt && format(new Date(req.fulfilledAt), 'dd MMM yyyy')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
