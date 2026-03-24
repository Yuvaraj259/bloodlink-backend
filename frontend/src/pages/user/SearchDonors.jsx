import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Phone, Eye, MessageCircle, CheckCircle, X, Loader, Clock, UserCheck, XCircle, Navigation, ExternalLink } from 'lucide-react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { Droplets, Building2, Heart } from 'lucide-react'
import API from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const links = [
  { to: '/user', label: 'Dashboard', icon: Droplets },
  { to: '/user/search', label: 'Search Donors', icon: Search },
  { to: '/user/emergency', label: 'Emergency Centers', icon: Building2 },
  { to: '/user/requests', label: 'My Requests', icon: Clock },
  { to: '/user/profile', label: 'My Profile', icon: Heart },
]


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
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function SearchDonors() {
  const { auth } = useAuth()
  const socketRef = useSocket()
  const [filters, setFilters] = useState({ bloodGroup: '', city: '' })
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [contactModal, setContactModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [requestModal, setRequestModal] = useState(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [requestForm, setRequestForm] = useState({ patientName: '', hospitalName: '', message: '', urgency: 'urgent' })
  const [userLocation, setUserLocation] = useState(null)


  // Waiting for donor approval state
  const [waitingModal, setWaitingModal] = useState(null)   // { donor, requestId }
  const [approvedDonor, setApprovedDonor] = useState(null) // donor details after YES
  const [declinedModal, setDeclinedModal] = useState(false)
  const [liveLocation, setLiveLocation] = useState(null)
  const waitingTimerRef = useRef(null)

  const search = async () => {
    if (!filters.bloodGroup && !filters.city) return toast.warning('Enter blood group or city to search')
    setLoading(true)
    try {
      const res = await API.get('/donors/search', { params: filters })
      setDonors(res.data)
      if (res.data.length === 0) toast.info('No available donors found in this area')
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  // Listen for donor accept/decline via socket
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !waitingModal) return

    const handleAccepted = async ({ requestId, donorId, donor, location }) => {
      console.log('[SearchDonors] Donor accepted via socket:', { requestId, donorId });
      if (requestId !== waitingModal?.requestId) return

      clearTimeout(waitingTimerRef.current)
      setWaitingModal(null) // Clear pulse immediately for better UX

      // If donor contact info is provided via socket (standard now), show immediately
      if (donor) {
        setApprovedDonor(donor)
        if (location) setLiveLocation(location)
        toast.success('🎉 Donor accepted! Details revealed below.')
        return
      }

      // Fallback: Fetch full details if not in payload
      try {
        const res = await API.get(`/donors/${waitingModal.donor._id}/contact`)
        setApprovedDonor(res.data)
        toast.success('🎉 Donor accepted! Details revealed below.')
      } catch {
        toast.error('Could not fetch donor details')
      }
    }

    const handleDeclined = ({ requestId }) => {
      console.log('[SearchDonors] Donor declined via socket:', requestId);
      if (requestId !== waitingModal?.requestId) return
      clearTimeout(waitingTimerRef.current)
      setWaitingModal(null)
      setDeclinedModal(true)
      toast.info('Donor is currently unavailable.')
    }

    socket.on(`request_accepted_${waitingModal.requestId}`, handleAccepted)
    socket.on('donor_accepted', handleAccepted)
    socket.on('donor_declined', handleDeclined)

    // Listen for live location updates for the accepted request
    const handleLocationUpdate = ({ userId, location }) => {
      if (approvedDonor && userId === approvedDonor._id) {
        setLiveLocation(location)
      }
    }
    socket.on(`location_updated_${waitingModal.requestId}`, handleLocationUpdate)

    return () => {
      socket.off(`request_accepted_${waitingModal.requestId}`, handleAccepted)
      socket.off('donor_accepted', handleAccepted)
      socket.off('donor_declined', handleDeclined)
      socket.off(`location_updated_${waitingModal.requestId}`, handleLocationUpdate)
    }
  }, [socketRef, waitingModal, approvedDonor])

  // Contact flow → send request → wait for donor
  const handleContactClick = (donor) => setContactModal(donor)

  const handleSendMessage = async () => {
    try {
      setSendingRequest(true)
      // Capture user location
      let currentPos = null
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
        })
        currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(currentPos)
      } catch (err) {
        console.warn('Geolocation failed', err)
      }

      // Send a blood request targeting this specific donor
      const res = await API.post('/requests', {
        patientName: auth?.user?.name || 'Patient',
        bloodGroup: contactModal.bloodGroup,
        location: { city: contactModal.location?.city },
        message: 'A user wants to contact you regarding blood donation.',
        urgency: 'urgent',
        userLocation: currentPos
      })
      const requestId = res.data.request?._id

      setContactModal(null)
      // Show waiting modal
      setWaitingModal({ donor: contactModal, requestId })

      // Auto-timeout after 2 minutes
      waitingTimerRef.current = setTimeout(() => {
        setWaitingModal(null)
        toast.warning('Donor did not respond. Try another donor.')
      }, 120000)

    } catch { toast.error('Failed to send message') }
  }

  // View Details
  const handleViewDetails = async (donor) => {
    try {
      const res = await API.get(`/donors/${donor._id}/details`)
      setDetailModal(res.data)
    } catch { toast.error('Could not fetch details') }
  }

  // Send Emergency Request to all donors (Generic)
  const handleSendRequest = async () => {
    setSendingRequest(true)
    try {
      // Get user location
      let currentPos = null
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(currentPos)
      } catch (err) { console.warn(err) }

      const userLocationInfo = auth?.user?.location || {}
      const res = await API.post('/requests', {
        ...requestForm,
        bloodGroup: filters.bloodGroup || requestModal?.bloodGroup || '',
        location: { city: userLocationInfo.city || filters.city },
        userLocation: currentPos
      })
      toast.success(`🩸 Request sent to ${res.data.notifiedCount} donors!`)
      setRequestModal(null)
      setRequestForm({ patientName: '', hospitalName: '', message: '', urgency: 'urgent' })
    } catch { toast.error('Failed to send request') }
    finally { setSendingRequest(false) }
  }

  // One-click Atomic Emergency Broadcast
  const handleOneClickEmergency = async () => {
    if (sendingRequest) return
    const user = auth?.user
    const city = filters.city || user?.location?.city || 'nearby city'
    const group = filters.bloodGroup || 'any'

    setSendingRequest(true)
    try {
      // Get user location
      let currentPos = null
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(currentPos)
      } catch (err) { console.warn(err) }

      const visibleDonorIds = donors.map(d => d._id)

      const res = await API.post('/requests', {
        patientName: user?.name || 'Emergency Patient',
        hospitalName: 'Nearby Hospital',
        message: `🔥 CRITICAL: Emergency ${group} blood needed immediately!`,
        urgency: 'critical',
        bloodGroup: filters.bloodGroup || '',
        location: { city: filters.city || user?.location?.city },
        donorIds: visibleDonorIds,
        userLocation: currentPos
      })
      toast.success(`💥 EMERGENCY BROADCAST SENT to ${res.data.notifiedCount} donors!`)
    } catch (err) {
      toast.error('Emergency broadcast failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setSendingRequest(false)
    }
  }

  const checkStatus = async () => {
    try {
      const res = await API.get(`/requests/my`)
      const accepted = res.data.find(r => 
        r._id === waitingModal?.requestId && r.status === 'accepted'
      )
      if (accepted) {
        const donorRes = await API.get(`/donors/${waitingModal.donor._id}/contact`)
        setApprovedDonor(donorRes.data)
        setWaitingModal(null)
        toast.success('🎉 Donor accepted!')
      } else {
        toast.info('Still waiting for donor response...')
      }
    } catch { toast.error('Failed to check status') }
  }

  return (
    <DashboardLayout links={links} portalLabel="User">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Search Donors</h1>
        <p className="text-gray-500 mb-6">Find available blood donors within 10km of your location</p>

        {/* Search Bar */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select className="input flex-1" value={filters.bloodGroup} onChange={e => setFilters({ ...filters, bloodGroup: e.target.value })}>
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            <input className="input flex-1" placeholder="Enter city..." value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && search()} />
            <button onClick={search} disabled={loading} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {BLOOD_GROUPS.map(g => (
              <button key={g} onClick={() => { setFilters({ ...filters, bloodGroup: g }); }}
                className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${filters.bloodGroup === g ? 'bg-blood-600 text-white border-blood-600' : 'bg-white text-blood-600 border-blood-300 hover:border-blood-600'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {donors.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">{donors.length} donor{donors.length > 1 ? 's' : ''} found</p>
            <button onClick={handleOneClickEmergency} disabled={sendingRequest}
              className="btn-primary text-sm flex items-center gap-2 emergency-pulse bg-red-600 hover:bg-red-700 border-red-600">
              {sendingRequest ? <Loader className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Send Emergency Request to All
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map(donor => (
            <div key={donor._id} className="card hover:shadow-md transition-all animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blood-100 text-blood-700 font-bold flex items-center justify-center text-sm">
                    {donor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{donor.name}</p>
                    <p className="text-xs text-gray-500">{donor.gender} • Age {donor.age}</p>
                  </div>
                </div>
                <span className="badge-blood">{donor.bloodGroup}</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <MapPin className="w-3.5 h-3.5" />
                {donor.location?.city || 'Location not set'}
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleViewDetails(donor)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
                <button onClick={() => handleContactClick(donor)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blood-100 text-blood-700 hover:bg-blood-200 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Contact
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Permission Modal */}
        {contactModal && (
          <Modal onClose={() => setContactModal(null)}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blood-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blood-600" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Request Contact Permission</h3>
              <p className="text-gray-500 text-sm mb-4">
                To protect donor privacy, an emergency message will be sent to <strong>{contactModal.name}</strong>.
                They will see the request and can choose to respond.
              </p>
              <div className="bg-blood-50 rounded-xl p-4 mb-6 text-left text-sm text-gray-700">
                <p className="font-medium text-blood-700 mb-1">Message that will be sent:</p>
                <p>"🩸 Emergency blood request — a patient near you urgently needs blood. Are you available to donate? [YES / NO]"</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setContactModal(null)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleSendMessage} className="flex-1 btn-primary">Send Message</button>
              </div>
            </div>
          </Modal>
        )}

        {/* ⏳ WAITING FOR DONOR APPROVAL MODAL */}
        {waitingModal && (
          <Modal onClose={null}>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <Clock className="w-10 h-10 text-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 rounded-full border-4 border-orange-300 border-t-orange-600 animate-spin" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Waiting for Donor Response</h3>
              <p className="text-gray-500 text-sm mb-4">
                Message sent to <strong className="text-blood-600">{waitingModal.donor?.name}</strong>.<br />
                Waiting for them to accept or decline...
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="badge-blood">{waitingModal.donor?.bloodGroup}</span>
                  <span className="text-sm text-gray-600">{waitingModal.donor?.location?.city}</span>
                </div>
                <p className="text-xs text-orange-600 font-medium">The donor will see YES / NO buttons on their screen</p>
              </div>

              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 bg-blood-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>

              <div className="space-y-3">
                <button onClick={checkStatus} className="btn-primary py-2 text-sm w-full bg-blue-600 hover:bg-blue-700">
                  Check Current Status
                </button>
                <button onClick={() => { clearTimeout(waitingTimerRef.current); setWaitingModal(null) }}
                  className="btn-secondary py-2 text-sm w-full">Cancel Request</button>
              </div>
            </div>
          </Modal>
        )}

        {/* ✅ DONOR APPROVED — Show Full Details */}
        {approvedDonor && (
          <Modal onClose={() => setApprovedDonor(null)}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                <CheckCircle className="w-4 h-4" /> Donor Accepted Your Request!
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Donor Contact Details</h3>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 text-left space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-green-200">
                  <div className="w-12 h-12 rounded-full bg-blood-600 text-white font-bold text-lg flex items-center justify-center">
                    {approvedDonor.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{approvedDonor.name}</p>
                    <span className="badge-blood">{approvedDonor.bloodGroup}</span>
                  </div>
                </div>
                <InfoRow label="📞 Phone" value={
                  <a href={`tel:${approvedDonor.phone}`} className="text-blood-600 font-bold hover:underline">{approvedDonor.phone}</a>
                } />
                <InfoRow label="📧 Email" value={approvedDonor.email} />
                <InfoRow label="📍 City" value={approvedDonor.location?.city || approvedDonor.donorCity} />

                {/* Map Section */}
                {(() => {
                  const donorPos = liveLocation || approvedDonor.donorLocation || approvedDonor.location?.coordinates
                  const hasDonorCoords = donorPos?.lat && donorPos?.lng
                  const hasUserCoords = userLocation?.lat && userLocation?.lng

                  if (!hasDonorCoords) {
                    return (
                      <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-700">
                        <p className="font-bold flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Fallback Location
                        </p>
                        <p>GPS coords not available (Donor accepted via SMS). Please use the city address above.</p>
                      </div>
                    )
                  }

                  const distance = hasUserCoords ? getDistanceKm(userLocation.lat, userLocation.lng, donorPos.lat, donorPos.lng) : null

                  return (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '250px' }}>
                        <MapContainer 
                          center={[donorPos.lat, donorPos.lng]} 
                          zoom={13} 
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          
                          {/* Donor Marker */}
                          <Marker position={[donorPos.lat, donorPos.lng]} icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color:#ef4444; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [12, 12],
                            iconAnchor: [6, 6]
                          })}>
                            <Popup>Donor Location</Popup>
                          </Marker>

                          {/* User Marker */}
                          {hasUserCoords && (
                            <>
                              <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({
                                className: 'custom-div-icon',
                                html: `<div style="background-color:#3b82f6; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                                iconSize: [12, 12],
                                iconAnchor: [6, 6]
                              })}>
                                <Popup>You are here</Popup>
                              </Marker>
                              <Polyline positions={[[userLocation.lat, userLocation.lng], [donorPos.lat, donorPos.lng]]} color="#6366f1" weight={3} dashArray="5, 10" />
                              <RecenterMap points={[[userLocation.lat, userLocation.lng], [donorPos.lat, donorPos.lng]]} />
                            </>
                          )}
                        </MapContainer>
                      </div>

                      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> You</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Donor</span>
                        </div>
                        {distance !== null && (
                          <div className={`px-2 py-1 rounded-full font-bold ${
                            distance < 2 ? 'bg-green-100 text-green-700' : 
                            distance < 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            📍 {distance.toFixed(1)} km away
                          </div>
                        )}
                      </div>

                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${donorPos.lat},${donorPos.lng}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <Navigation className="w-4 h-4" /> Get Directions
                      </a>
                    </div>
                  )
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <a href={`tel:${approvedDonor.phone}`}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
                  <Phone className="w-4 h-4" /> Call Now
                </a>
                <a href={`https://wa.me/${approvedDonor.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                  💬 WhatsApp
                </a>
              </div>

              <button onClick={() => setApprovedDonor(null)} className="btn-secondary w-full text-sm">Close</button>
            </div>
          </Modal>
        )}

        {/* ❌ DONOR DECLINED */}
        {declinedModal && (
          <Modal onClose={() => setDeclinedModal(false)}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Donor Not Available</h3>
              <p className="text-gray-500 text-sm mb-5">
                The donor is <strong>not available</strong> for donating blood at this time.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-700 font-medium">The donor has declined your request.</p>
                <p className="text-xs text-red-500 mt-1">Please try contacting another donor.</p>
              </div>
              <button onClick={() => setDeclinedModal(false)} className="btn-primary w-full">
                Search Other Donors
              </button>
            </div>
          </Modal>
        )}

        {/* View Details Modal */}
        {detailModal && (
          <Modal onClose={() => setDetailModal(null)}>
            <h3 className="font-display text-xl font-bold mb-4">Donor Details</h3>
            <div className="space-y-3">
              <InfoRow label="Name" value={detailModal.name} />
              <InfoRow label="Blood Group" value={detailModal.bloodGroup} />
              <InfoRow label="Age" value={detailModal.age} />
              <InfoRow label="Gender" value={detailModal.gender} />
              <InfoRow label="City" value={detailModal.location?.city} />
              <InfoRow label="Registered By" value={detailModal.registeredBy} />
              <InfoRow label="Total Donations" value={detailModal.donationHistory?.length || 0} />
              <InfoRow label="Availability" value={detailModal.isAvailable ? '✅ Available' : '❌ Not Available'} />
            </div>
            <button onClick={() => setDetailModal(null)} className="btn-primary mt-6 w-full">Close</button>
          </Modal>
        )}

        {/* Emergency Request Modal */}
        {requestModal && (
          <Modal onClose={() => setRequestModal(null)}>
            <h3 className="font-display text-xl font-bold mb-4">Send Emergency Blood Request</h3>
            <div className="space-y-3">
              <div><label className="label">Patient Name</label><input className="input" value={requestForm.patientName} onChange={e => setRequestForm({ ...requestForm, patientName: e.target.value })} required /></div>
              <div><label className="label">Hospital Name</label><input className="input" value={requestForm.hospitalName} onChange={e => setRequestForm({ ...requestForm, hospitalName: e.target.value })} /></div>
              <div><label className="label">Message (optional)</label><textarea className="input resize-none" rows={2} value={requestForm.message} onChange={e => setRequestForm({ ...requestForm, message: e.target.value })} /></div>
              <div><label className="label">Urgency</label>
                <select className="input" value={requestForm.urgency} onChange={e => setRequestForm({ ...requestForm, urgency: e.target.value })}>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRequestModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSendRequest} disabled={sendingRequest || !requestForm.patientName} className="flex-1 btn-primary">
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-green-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  )
}
