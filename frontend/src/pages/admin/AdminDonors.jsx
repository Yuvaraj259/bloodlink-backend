import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { 
  Droplets, Building2, FileText, Users, BarChart3, Check, X, Trash2, Search, 
  MapPin, Phone, Mail, User, Calendar, Activity, ShieldCheck, ExternalLink, 
  ChevronRight, AlertCircle, CheckCircle2, XCircle, Clock, Info
} from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'
import { format } from 'date-fns'

const links = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/donors', label: 'Donors', icon: Droplets },
  { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/admin/requests', label: 'Blood Requests', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
]

// Add custom styles for animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
  .animate-modal-in { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`


export default function AdminDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('pending')
  const [selectedDonor, setSelectedDonor] = useState(null)

  const fetchDonors = async () => {
    try {
      const response = await API.get('/admin/donors')
      setDonors(response.data)
    } catch (error) {
      toast.error('Failed to load donors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDonors()
  }, [])

  const approve = async (id) => {
    try {
      await API.put(`/admin/donors/${id}/approve`)
      toast.success('Donor approved successfully!')
      setSelectedDonor(null)
      fetchDonors()
    } catch (error) {
      toast.error('Failed to approve donor')
    }
  }

  const reject = async (id) => {
    if (!confirm('Reject and remove this donor?')) return
    try {
      await API.put(`/admin/donors/${id}/reject`)
      toast.success('Donor application rejected')
      setSelectedDonor(null)
      fetchDonors()
    } catch (error) {
      toast.error('Failed to reject donor')
    }
  }

  const deleteDonor = async (id) => {
    if (!confirm('Delete this donor permanently? This action cannot be undone.')) return
    try {
      await API.delete(`/admin/donors/${id}`)
      toast.success('Donor deleted successfully')
      setSelectedDonor(null)
      fetchDonors()
    } catch (error) {
      toast.error('Failed to delete donor')
    }
  }

  const filtered = donors.filter(d => {
    const matchSearch = 
      d.name?.toLowerCase().includes(search.toLowerCase()) || 
      d.email?.toLowerCase().includes(search.toLowerCase()) || 
      d.location?.city?.toLowerCase().includes(search.toLowerCase()) ||
      d.bloodGroup?.toLowerCase().includes(search.toLowerCase())
    
    const matchFilter = 
      filter === 'all' || 
      (filter === 'pending' && !d.isApproved) || 
      (filter === 'approved' && d.isApproved)
    
    return matchSearch && matchFilter
  })

  const stats = {
    total: donors.length,
    pending: donors.filter(d => !d.isApproved).length,
    approved: donors.filter(d => d.isApproved).length
  }

  // Helper to check if file is image
  const isImage = (url) => {
    if (!url || typeof url !== 'string') return false
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null
  }

  return (
    <DashboardLayout links={links} portalLabel="Admin">
      <style>{customStyles}</style>
      <div className="animate-fade-in max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold text-gray-900 tracking-tight">Donor Verification</h1>
            <p className="text-gray-500 mt-2 text-lg">Verify health certificates and manage registered donors</p>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
            <StatCard label="Total Donors" value={stats.total} icon={Users} color="bg-blue-50 text-blue-600" />
            <StatCard label="Pending Approval" value={stats.pending} icon={Clock} color="bg-orange-50 text-orange-600" />
            <StatCard label="Approved Users" value={stats.approved} icon={CheckCircle2} color="bg-green-50 text-green-600" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-red-50 flex flex-col md:flex-row gap-4 items-center ring-1 ring-black/5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blood-500 transition-all font-medium" 
              placeholder="Search by name, email, city or blood group..." 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex bg-gray-100/80 p-1 rounded-2xl shrink-0 w-full md:w-auto">
            {['pending', 'approved', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  filter === f 
                    ? 'bg-white text-blood-600 shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300">
            <div className="animate-spin w-12 h-12 border-4 border-blood-600 border-t-transparent rounded-full mb-4" />
            <p className="text-gray-500 font-medium">Loading donor database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(donor => (
              <DonorCard 
                key={donor._id} 
                donor={donor} 
                onView={() => setSelectedDonor(donor)}
                onApprove={() => approve(donor._id)}
                onReject={() => reject(donor._id)}
                onDelete={() => deleteDonor(donor._id)}
              />
            ))}
            
            {filtered.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-medium italic">No donors match your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Details Modal */}
      {selectedDonor && (
        <DonorDetailsModal 
          donor={selectedDonor} 
          onClose={() => setSelectedDonor(null)}
          onApprove={() => approve(selectedDonor._id)}
          onReject={() => reject(selectedDonor._id)}
          onDelete={() => deleteDonor(selectedDonor._id)}
          isImage={isImage}
        />
      )}
    </DashboardLayout>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl shadow-sm border border-black/5 min-w-[180px] transition-transform hover:-translate-y-1 bg-white`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  )
}

function DonorCard({ donor, onView, onApprove, onReject, onDelete }) {
  const hasCertificate = donor.healthCertificateUrl && donor.healthCertificateUrl !== 'pending_upload'
  
  return (
    <div className={`p-5 rounded-[2rem] bg-white border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col md:flex-row gap-5 items-start md:items-center ${
      !donor.isApproved ? 'border-orange-100 ring-4 ring-orange-50/50' : 'border-gray-50'
    }`}>
      {/* Left: Initials/Avatar */}
      <div className="relative shrink-0">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${
          !donor.isApproved ? 'bg-orange-100 text-orange-600' : 'bg-blood-100 text-blood-700'
        }`}>
          {donor.name?.charAt(0)}
        </div>
        {!donor.isApproved && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full animate-pulse shadow-md">
            <Clock className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Middle: Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xl font-bold text-gray-900 truncate">{donor.name}</h3>
          <span className="badge-blood px-3 py-0.5 rounded-full text-sm font-bold shadow-sm">{donor.bloodGroup}</span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-lg font-bold">{donor.age}y</span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-lg font-bold capitalize">{donor.gender?.[0]}</span>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-xl">
            {donor.isApproved ? (
              <><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-green-700 font-bold">Approved</span></>
            ) : (
              <><Clock className="w-4 h-4 text-orange-600" /><span className="text-orange-700 font-bold">Pending Approval</span></>
            )}
          </div>
          
          <div className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-xl font-semibold ${
            hasCertificate ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-600'
          }`}>
            {hasCertificate ? <FileText className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {hasCertificate ? 'Certificate Uploaded' : 'No Certificate'}
          </div>

          {donor.healthDeclared && (
            <div className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-xl font-semibold bg-emerald-50 text-emerald-700">
              <Activity className="w-4 h-4" />
              Health Declared
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
        <button 
          onClick={onView}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          View Details
        </button>
        
        {!donor.isApproved ? (
          <>
            <button 
              onClick={onApprove}
              className="p-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95 group"
              title="Approve Donor"
            >
              <Check className="w-5 h-5 group-hover:scale-110" />
            </button>
            <button 
              onClick={onReject}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 group"
              title="Reject Application"
            >
              <X className="w-5 h-5 group-hover:scale-110" />
            </button>
          </>
        ) : (
          <button 
            onClick={onDelete}
            className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 group"
            title="Delete Donor"
          >
            <Trash2 className="w-5 h-5 group-hover:scale-110" />
          </button>
        )}
      </div>
    </div>
  )
}

function DonorDetailsModal({ donor, onClose, onApprove, onReject, onDelete, isImage }) {
  const hasCertificate = donor.healthCertificateUrl && donor.healthCertificateUrl !== 'pending_upload'
  const isPending = !donor.isApproved

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-modal-in">
        {/* Modal Header */}
        <div className={`p-8 shrink-0 flex items-center justify-between transition-colors ${
          isPending ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
        }`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {donor.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-white tracking-tight">{donor.name}</h2>
                <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full text-sm font-black border border-white/20">
                  {donor.bloodGroup}
                </span>
              </div>
              <p className="text-white/80 font-medium text-lg mt-1 italic opacity-90 leading-none">
                {isPending ? 'Donor Verification Required' : 'Verified Registered Donor'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          {/* SECTION 1 - Personal Information */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem icon={Mail} label="Email Address" value={donor.email} />
              <InfoItem icon={Phone} label="Phone Number" value={donor.phone} />
              <InfoItem icon={Users} label="Age & Gender" value={`${donor.age} years, ${donor.gender}`} />
              <InfoItem icon={MapPin} label="City / Location" value={donor.location?.city} />
              <InfoItem icon={MapPin} label="Residential Address" value={donor.location?.address} span={2} />
              <InfoItem icon={Activity} label="Registered Via" value={donor.registeredBy} isBadge />
              <InfoItem icon={Calendar} label="Registration Date" value={format(new Date(donor.createdAt), 'MMMM dd, yyyy')} />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* SECTION 2 - Health Status */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Health & Verification Status</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusBadge icon={donor.healthDeclared ? CheckCircle2 : XCircle} label="Health Declared" active={donor.healthDeclared} type={donor.healthDeclared ? 'success' : 'danger'} />
              <StatusBadge icon={hasCertificate ? CheckCircle2 : XCircle} label="Certificate Uploaded" active={hasCertificate} type={hasCertificate ? 'success' : 'danger'} />
              <StatusBadge icon={donor.certificateVerified ? CheckCircle2 : Clock} label="Admin Verified" active={donor.certificateVerified} type={donor.certificateVerified ? 'success' : 'warning'} />
              <StatusBadge icon={donor.isApproved ? ShieldCheck : Clock} label="Account Status" active={donor.isApproved} type={donor.isApproved ? 'success' : 'warning'} />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* SECTION 3 - Health Certificate Viewer */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Health Certificate</h3>
              </div>
              
              {hasCertificate && (
                <a 
                  href={donor.healthCertificateUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-xl"
                >
                  <ExternalLink className="w-4 h-4" /> Open Full Certificate
                </a>
              )}
            </div>
            
            {!hasCertificate ? (
              <div className="bg-red-50/50 border-2 border-dashed border-red-200 rounded-3xl p-8 flex flex-col items-center justify-center text-red-600 group hover:bg-red-50 transition-colors">
                <AlertCircle className="w-12 h-12 mb-3 group-hover:animate-bounce" />
                <p className="font-black text-lg">No Certificate Uploaded</p>
                <p className="text-sm text-red-400 mt-1">Donor needs to upload a valid health certificate for approval.</p>
              </div>
            ) : isImage(donor.healthCertificateUrl) ? (
              <div className="relative group overflow-hidden rounded-3xl border border-gray-100 shadow-xl bg-gray-900/5 ring-1 ring-black/5">
                <img 
                  src={donor.healthCertificateUrl} 
                  alt="Health Certificate" 
                  className="w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold shadow-2xl flex items-center gap-2">
                     <Search className="w-4 h-4" /> Click to enlarge
                   </div>
                </div>
                <a 
                  href={donor.healthCertificateUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute inset-0"
                />
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-10 flex flex-col items-center justify-center transition-all hover:shadow-lg">
                <FileText className="w-16 h-16 text-indigo-500 mb-4" />
                <p className="font-extrabold text-indigo-900 text-xl">PDF Certificate File</p>
                <p className="text-indigo-600/70 mb-6 text-center max-w-sm">This certificate is a PDF document and cannot be previewed directly here.</p>
                <a 
                  href={donor.healthCertificateUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2"
                >
                  Open PDF in New Tab <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}
          </div>

          {/* SECTION 4 - Donation History */}
          {donor.donationHistory && donor.donationHistory.length > 0 && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">Donation History</h3>
                </div>
                
                <div className="space-y-4">
                  {donor.donationHistory.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blood-50 rounded-xl flex items-center justify-center group-hover:bg-blood-100 transition-colors">
                            <Droplets className="w-6 h-6 text-blood-600" />
                         </div>
                         <div>
                           <p className="font-black text-gray-900 text-lg">{item.hospitalName}</p>
                           <p className="text-sm text-gray-500 font-medium">{format(new Date(item.date), 'dd MMM yyyy')}</p>
                         </div>
                       </div>
                       {item.certificateUrl && (
                         <a 
                           href={item.certificateUrl} 
                           target="_blank" 
                           rel="noreferrer"
                           className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-blood-50 hover:text-blood-600 transition-all border border-gray-100"
                           title="View Donation Certificate"
                         >
                           <FileText className="w-5 h-5" />
                         </a>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* SECTION 5 - Modal Footer Actions */}
        <div className="p-8 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          {isPending ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 text-gray-500 flex items-center gap-2 italic">
                <Info className="w-4 h-4 text-orange-500" />
                Carefully review all records before final approval.
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={onReject}
                  className="flex-1 sm:flex-none px-10 py-4 bg-white text-red-600 border-2 border-red-100 rounded-2xl font-black hover:bg-red-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" /> Reject Donor
                </button>
                <button 
                  onClick={onApprove}
                  className="flex-1 sm:flex-none px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Approve Donor
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100 w-full sm:w-auto">
                 <ShieldCheck className="w-6 h-6" /> This donor is fully verified and approved
              </div>
              <button 
                onClick={onDelete}
                className="w-full sm:w-auto px-10 py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Remove Donor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, span = 1, isBadge = false }) {
  return (
    <div className={`${span === 2 ? 'sm:col-span-2' : ''} space-y-2`}>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      {isBadge ? (
        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-black border border-blue-100 uppercase tracking-wide">
          {value}
        </span>
      ) : (
        <p className="text-gray-900 font-bold bg-gray-50/50 p-3 rounded-2xl border border-gray-100 break-words">{value || 'N/A'}</p>
      )}
    </div>
  )
}

function StatusBadge({ icon: Icon, label, active, type }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-orange-50 text-orange-700 border-orange-100',
    danger: 'bg-red-50 text-red-600 border-red-100',
  }
  
  return (
    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-transform hover:scale-[1.02] ${styles[type]}`}>
      <div className="shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{label}</p>
        <p className="font-black text-xs sm:text-sm">
          {active ? (type === 'success' ? 'Verified' : 'Yes') : (type === 'danger' ? 'Missing' : 'Pending')}
        </p>
      </div>
    </div>
  )
}
