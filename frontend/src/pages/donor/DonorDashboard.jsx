import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Award, Clock, User, Bell, CheckCircle, XCircle, MapPin, Droplets, FileText, Loader, Navigation } from 'lucide-react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import API from '../../utils/api'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'


// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Haversine Distance Formula
function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Map Auto-fitter
function RecenterMap({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [points, map])
  return null
}

const links = [
  { to: '/donor', label: 'Dashboard', icon: Droplets },
  { to: '/donor/profile', label: 'My Profile', icon: User },
  { to: '/donor/history', label: 'Donation History', icon: Clock },
  { to: '/donor/certificates', label: 'Certificates', icon: Award },
  { to: '/donor/requests', label: 'Blood Requests', icon: Bell },
]

export default function DonorDashboard() {
  const { auth } = useAuth()
  const socketRef = useSocket()
  const donor = auth?.donor
  const [history, setHistory] = useState([])
  const [activeRequest, setActiveRequest] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [acceptedRequestId, setAcceptedRequestId] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)

  useEffect(() => {
    API.get('/donors/history').then(r => setHistory(r.data?.donationHistory || [])).catch(() => { })

    // Check for already accepted active request
    API.get('/requests/active').then(r => {
      if (r.data?._id) {
        setAcceptedRequestId(r.data._id)
        toast.info('Resuming live location sharing for your active donation.')
      }
    }).catch(() => { })
  }, [])

  // Real-time blood request listener
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !donor?._id) return

    const handleRequest = (data) => {
      console.log('🩸 Blood request received:', data)
      setActiveRequest(data)
      toast.warning(`🩸 Emergency! Patient needs ${data.bloodGroup} blood`, { autoClose: false })
    }

    const handleFulfilled = (data) => {
      if (activeRequest?.requestId === data.requestId) {
        setActiveRequest(null)
        setShowMapModal(false)
        toast.dismiss()
        toast.success('✅ A donor has already been found. Thank you for your coordination!', { icon: '🙏' })
      }
    }

    // Listen on both event names for reliability
    socket.on('blood_request', handleRequest)
    socket.on(`request_${donor._id}`, handleRequest)
    socket.on('request_fulfilled_notify', handleFulfilled)

    // Re-register socket with donor ID every time this effect runs
    if (socket.connected) {
      socket.emit('register', donor._id)
    }
    socket.on('connect', () => socket.emit('register', donor._id))

    return () => {
      socket.off('blood_request', handleRequest)
      socket.off(`request_${donor._id}`, handleRequest)
      socket.off('request_fulfilled_notify', handleFulfilled)
      socket.off('connect')
    }
  }, [socketRef, donor?._id, activeRequest])

  // Live location tracking after acceptance
  useEffect(() => {
    const socket = socketRef?.current
    if (!acceptedRequestId || !socket || !donor?._id) return

    console.log('Starting live location tracking for request:', acceptedRequestId)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        socket.emit('donor_location_update', {
          requestId: acceptedRequestId,
          userId: donor._id,
          location
        })
      },
      (err) => console.error('Location Watch Error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => {
      console.log('Stopping live location tracking')
      navigator.geolocation.clearWatch(watchId)
    }
  }, [acceptedRequestId, socketRef, donor?._id])

  const handleAcceptClick = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setShowMapModal(true)
      },
      (err) => {
        toast.error('Location access denied. We need your location to proceed.')
        console.error(err)
      }
    )
  }

  const confirmAccept = async () => {
    setAccepting(true)
    try {
      await API.post(`/requests/${activeRequest.requestId}/accept`, { location: myLocation })
      toast.success('You accepted! Your location is being shared.')
      setAcceptedRequestId(activeRequest.requestId)
      setActiveRequest(null)
      setShowMapModal(false)
    } catch {
      toast.error('Failed to accept')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    try {
      await API.post(`/requests/${activeRequest.requestId}/decline`)
      toast.info('You declined. Thank you for responding.')
      setActiveRequest(null)
      setShowMapModal(false)
    } catch { toast.error('Failed to decline') }
  }


  const isHidden = donor?.isHidden
  const hiddenUntil = donor?.hiddenUntil

  return (
    <DashboardLayout links={links} portalLabel="Donor">
      {/* Live Tracking Indicator */}
      {acceptedRequestId && (
        <div className="bg-blue-600 text-white p-4 rounded-xl mb-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <div>
              <p className="font-bold">Live Location Sharing Active</p>
              <p className="text-xs opacity-90">Requester is receiving your real-time location. Please proceed to the hospital.</p>
            </div>
          </div>
          <MapPin className="w-6 h-6" />
        </div>
      )}

      {/* Emergency Alert Banner */}
      {activeRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl emergency-pulse border-4 border-blood-600 text-center animate-slide-up">
            <div className="text-6xl mb-4">🩸</div>
            <h2 className="font-display text-2xl font-bold text-blood-700 mb-2">EMERGENCY REQUEST</h2>
            <p className="text-gray-600 mb-4">Emergency blood is required for a patient. Are you available to donate?</p>
            <div className="bg-blood-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold text-gray-900">{activeRequest.patientName || 'Patient'}</p>
              <p className="text-blood-600 font-bold text-lg">{activeRequest.bloodGroup} blood needed</p>
              {activeRequest.hospitalName && <p className="text-sm text-gray-500">📍 {activeRequest.hospitalName}</p>}
              {activeRequest.message && <p className="text-sm text-gray-600 mt-1">"{activeRequest.message}"</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleDecline} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                <XCircle className="w-5 h-5" /> NO
              </button>
              <button onClick={handleAcceptClick} disabled={accepting}
                className="flex-1 flex items-center justify-center gap-2 bg-blood-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blood-700 transition-colors disabled:opacity-70">
                {accepting ? <><Loader className="w-5 h-5 animate-spin" /> Accepting...</> : <><CheckCircle className="w-5 h-5" /> YES, I'll Donate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Preview Modal before accepting */}
      {showMapModal && activeRequest && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in">
            <h3 className="font-display text-xl font-bold mb-2">Location Overview</h3>
            <p className="text-gray-500 text-sm mb-4">View the patient's location before confirming your arrival.</p>
            
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ height: '250px' }}>
              <MapContainer 
                center={[myLocation?.lat || 0, myLocation?.lng || 0]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Donor Marker */}
                {myLocation && (
                  <Marker position={[myLocation.lat, myLocation.lng]} icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:#3b82f6; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                  })}>
                    <Popup>Your Location</Popup>
                  </Marker>
                )}

                {/* User/Patient Marker */}
                {activeRequest.userLocation && (
                  <Marker position={[activeRequest.userLocation.lat, activeRequest.userLocation.lng]} icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:#ef4444; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                  })}>
                    <Popup>Patient Location</Popup>
                  </Marker>
                )}

                {myLocation && activeRequest.userLocation && (
                   <>
                    <Polyline positions={[[myLocation.lat, myLocation.lng], [activeRequest.userLocation.lat, activeRequest.userLocation.lng]]} color="#6366f1" weight={3} dashArray="5, 10" />
                    <RecenterMap points={[[myLocation.lat, myLocation.lng], [activeRequest.userLocation.lat, activeRequest.userLocation.lng]]} />
                   </>
                )}
              </MapContainer>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              {(() => {
                const dist = getDistanceKm(myLocation?.lat, myLocation?.lng, activeRequest.userLocation?.lat, activeRequest.userLocation?.lng)
                if (!dist) return <p className="text-sm text-gray-500 italic">User GPS not available</p>
                
                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Distance:</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        dist < 2 ? 'bg-green-100 text-green-700' : 
                        dist < 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        📍 {dist.toFixed(1)} km away
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Estimated Arrival:</span>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-800">🚶 {Math.round((dist / 5) * 60)} mins walking</p>
                        <p className="text-xs font-bold text-gray-800">🚗 {Math.round((dist / 40) * 60)} mins driving</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>


            <div className="flex gap-3">
              <button onClick={() => setShowMapModal(false)} className="flex-1 btn-secondary py-3">Back</button>
              <button 
                onClick={confirmAccept} 
                className="flex-1 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 py-3 shadow-lg shadow-green-100"
              >
                <Navigation className="w-5 h-5" /> I'm Coming
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome, {donor?.name?.split(' ')[0]} 💉</h1>
        <p className="text-gray-500 mb-6">Thank you for being a lifesaver</p>

        {/* Hidden Notice */}
        {isHidden && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Your profile is temporarily hidden</p>
              <p className="text-sm text-orange-600">You recently donated blood. Your profile will be visible again after {hiddenUntil ? new Date(hiddenUntil).toDateString() : '3 months'}.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Blood Group', value: donor?.bloodGroup || '—', icon: Droplets, color: 'text-blood-600 bg-blood-50' },
            { label: 'Total Donations', value: history.length, icon: Heart, color: 'text-red-600 bg-red-50' },
            { label: 'Certificates', value: history.filter(h => h.certificateUrl).length, icon: Award, color: 'text-purple-600 bg-purple-50' },
            { label: 'Status', value: donor?.isAvailable && !isHidden ? 'Available' : 'Hidden', icon: User, color: 'text-green-600 bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/donor/profile" className="card hover:shadow-md transition-all group text-center">
            <User className="w-8 h-8 text-blood-600 mx-auto mb-2" />
            <h3 className="font-semibold">Update Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Keep your info current</p>
          </Link>
          <Link to="/donor/history" className="card hover:shadow-md transition-all group text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Donation History</h3>
            <p className="text-sm text-gray-500 mt-1">All your past donations</p>
          </Link>
          <Link to="/donor/certificates" className="card hover:shadow-md transition-all group text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">My Certificates</h3>
            <p className="text-sm text-gray-500 mt-1">Download your certificates</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
