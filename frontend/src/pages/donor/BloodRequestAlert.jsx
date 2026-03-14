import { useEffect, useState } from 'react'
import { Bell, CheckCircle, XCircle, User, Clock, Award, Droplets, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'
import { format } from 'date-fns'

const links = [
  { to: '/donor', label: 'Dashboard', icon: Droplets },
  { to: '/donor/profile', label: 'My Profile', icon: User },
  { to: '/donor/history', label: 'Donation History', icon: Clock },
  { to: '/donor/certificates', label: 'Certificates', icon: Award },
  { to: '/donor/requests', label: 'Blood Requests', icon: Bell },
]

export default function BloodRequestAlert() {
  const { auth } = useAuth()
  const socketRef = useSocket()
  const [requests, setRequests] = useState([])
  const [responding, setResponding] = useState(null)

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !auth?.donor?._id) return

    const handleRequest = (data) => {
      setRequests(prev => [{ ...data, receivedAt: new Date() }, ...prev])
      toast.warning(`🩸 New blood request: ${data.bloodGroup} needed!`)
    }

    const handleFulfilled = ({ requestId }) => {
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'fulfilled' } : r))
      toast.info('This request has been fulfilled by another donor. Thank you!')
    }

    socket.on(`request_${auth.donor._id}`, handleRequest)
    socket.on('blood_request', handleRequest)
    socket.on('request_fulfilled_notify', handleFulfilled)

    return () => {
      socket.off(`request_${auth.donor._id}`, handleRequest)
      socket.off('blood_request', handleRequest)
      socket.off('request_fulfilled_notify', handleFulfilled)
    }
  }, [socketRef, auth])

  const handleAccept = async (req) => {
    setResponding(req.requestId)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        await API.post(`/requests/${req.requestId}/accept`, { location })
        toast.success('✅ Accepted! Your live location is being shared with the patient.')
        setRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: 'accepted' } : r))
      } catch { toast.error('Failed to accept request') }
      finally { setResponding(null) }
    }, () => {
      toast.error('Location access required to accept')
      setResponding(null)
    })
  }

  const handleDecline = async (req) => {
    setResponding(req.requestId)
    try {
      await API.post(`/requests/${req.requestId}/decline`)
      toast.info('You declined this request.')
      setRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: 'declined' } : r))
    } catch { toast.error('Failed to decline') }
    finally { setResponding(null) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Donor">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blood-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Blood Requests</h1>
          {requests.filter(r => !r.status).length > 0 && (
            <span className="bg-blood-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse-red">
              {requests.filter(r => !r.status).length} New
            </span>
          )}
        </div>
        <p className="text-gray-500 mb-6">Real-time emergency blood requests near you</p>

        {requests.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No requests yet</p>
            <p className="text-gray-400 text-sm mt-1">Emergency blood requests will appear here in real time</p>
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 max-w-xs mx-auto">
              <p className="text-green-700 text-sm font-medium">✅ You are active and listening</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req, i) => {
              const isPending = !req.status
              const isAccepted = req.status === 'accepted'
              const isDeclined = req.status === 'declined'
              const isFulfilled = req.status === 'fulfilled'

              return (
                <div key={i} className={`card border-2 transition-all ${isPending ? 'border-blood-300 emergency-pulse' : isAccepted ? 'border-green-300' : 'border-gray-200 opacity-70'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge-blood text-base">{req.bloodGroup}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isPending ? 'bg-orange-100 text-orange-700' :
                          isAccepted ? 'bg-green-100 text-green-700' :
                          isFulfilled ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isPending ? '⏳ Pending Response' : isAccepted ? '✅ Accepted' : isFulfilled ? '🎉 Fulfilled' : '❌ Declined'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.urgency === 'critical' ? 'bg-red-200 text-red-800' : req.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {req.urgency || 'urgent'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-lg">{req.patientName || 'Patient'}</h3>
                      {req.hospitalName && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {req.hospitalName}
                        </div>
                      )}
                      {req.message && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2">"{req.message}"</p>}
                      <p className="text-xs text-gray-400 mt-2">Received {req.receivedAt ? format(new Date(req.receivedAt), 'hh:mm a') : 'just now'}</p>
                    </div>

                    {isPending && (
                      <div className="flex gap-3">
                        <button onClick={() => handleDecline(req)} disabled={responding === req.requestId}
                          className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                          <XCircle className="w-5 h-5" /> NO
                        </button>
                        <button onClick={() => handleAccept(req)} disabled={responding === req.requestId}
                          className="flex items-center gap-2 px-5 py-3 bg-blood-600 text-white rounded-xl font-bold hover:bg-blood-700 transition-colors">
                          <CheckCircle className="w-5 h-5" />
                          {responding === req.requestId ? 'Sending...' : "YES, I'll Donate"}
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center min-w-[140px]">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-green-800">Accepted!</p>
                        <p className="text-xs text-green-600">Location shared</p>
                      </div>
                    )}

                    {isFulfilled && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center min-w-[140px]">
                        <p className="text-2xl mb-1">🎉</p>
                        <p className="text-sm font-medium text-blue-800">Request Fulfilled</p>
                        <p className="text-xs text-blue-600">Thank you!</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
