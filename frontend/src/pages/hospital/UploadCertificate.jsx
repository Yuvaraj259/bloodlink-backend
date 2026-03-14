import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Award, Upload, FileText, Users, UserPlus, Building2, BarChart3, Search, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'

const links = [
  { to: '/hospital', label: 'Dashboard', icon: BarChart3 },
  { to: '/hospital/register-donor', label: 'Register Donor', icon: UserPlus },
  { to: '/hospital/donors', label: 'My Donors', icon: Users },
  { to: '/hospital/certificates', label: 'Upload Certificate', icon: Award },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

export default function UploadCertificate() {
  const [donors, setDonors] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [mode, setMode] = useState('generate') // 'generate' | 'upload'
  const [file, setFile] = useState(null)
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    API.get('/hospitals/my-donors').then(r => setDonors(r.data)).catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!searchQuery) return
    setSearching(true)
    try {
      const res = await API.get(`/hospitals/search-donors?query=${searchQuery}`)
      setSearchResults(res.data)
      if (res.data.length === 0) toast.info('No donor found with that phone/email')
    } catch { toast.error('Search failed') }
    finally { setSearching(false) }
  }

  const handleGenerate = async () => {
    if (!selectedDonor) return toast.warning('Select a donor first')
    setLoading(true)
    try {
      const res = await API.post(`/certificates/generate/${selectedDonor._id}`, { donationDate })
      setResult(res.data.certificateUrl)
      toast.success('Certificate generated!')
    } catch { toast.error('Failed to generate certificate') }
    finally { setLoading(false) }
  }

  const handleUpload = async () => {
    if (!selectedDonor || !file) return toast.warning('Select donor and file')
    setLoading(true)
    const formData = new FormData()
    formData.append('certificate', file)
    try {
      const res = await API.post(`/certificates/upload/${selectedDonor._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data.certificateUrl)
      toast.success('Certificate uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Hospital">
      <div className="animate-fade-in max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Issue Digital Certificate</h1>
        <p className="text-gray-500 mb-8">Recognize donors with a digital certificate they can download anywhere.</p>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">Certificate Ready!</p>
                <p className="text-green-700 text-sm">Issued successfully to {selectedDonor?.name}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <a href={result} target="_blank" rel="noreferrer" className="flex-1 md:flex-none btn-primary px-8 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> View/Download
              </a>
              <button onClick={() => {setResult(null); setSelectedDonor(null); setSearchResults([]); setSearchQuery('')}} className="btn-secondary px-6">Issue Another</button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Find Donor */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blood-600" /> 1. Select Donor
              </h3>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Enter Donor Phone or Email..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <button onClick={handleSearch} disabled={searching} className="absolute right-2 top-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">
                  {searching ? '...' : 'FIND'}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(d => (
                    <button key={d._id} onClick={() => setSelectedDonor(d)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedDonor?._id === d._id ? 'border-blood-600 bg-blood-50 shadow-sm' : 'border-gray-100 hover:border-blood-200'}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900">{d.name}</p>
                        <span className="badge-blood">{d.bloodGroup}</span>
                      </div>
                      <p className="text-xs text-gray-500">{d.phone} · {d.location?.city}</p>
                    </button>
                  ))
                ) : (
                  <>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">My Registered Donors</p>
                    {donors.map(d => (
                      <button key={d._id} onClick={() => setSelectedDonor(d)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedDonor?._id === d._id ? 'border-blood-600 bg-blood-50 shadow-sm' : 'border-gray-100 hover:border-blood-200'}`}>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">{d.name}</p>
                          <span className="badge-blood">{d.bloodGroup}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right">Registered by you</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Issue Section */}
          <div className={`${!selectedDonor ? 'opacity-50 pointer-events-none' : 'animate-fade-in'}`}>
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" /> 2. Certificate Details
              </h3>

              <div className="mb-6">
                <label className="label">Donation Date</label>
                <input className="input" type="date" value={donationDate} onChange={e=>setDonationDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="flex bg-gray-50 rounded-2xl p-1 mb-6">
                <button onClick={()=>setMode('generate')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode==='generate'?'bg-white text-blood-600 shadow-sm':'text-gray-500'}`}>
                  Auto-Generate PDF
                </button>
                <button onClick={()=>setMode('upload')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode==='upload'?'bg-white text-blood-600 shadow-sm':'text-gray-500'}`}>
                  Upload Scan/Photo
                </button>
              </div>

              {mode === 'generate' ? (
                <div className="text-center py-4">
                  <div className="bg-blood-50 border border-blood-100 rounded-2xl p-6 mb-6">
                    < Award className="w-12 h-12 text-blood-600 mx-auto mb-3" />
                    <p className="font-bold text-gray-900">Official Digital Award</p>
                    <p className="text-xs text-gray-500 mt-1">We will generate a high-quality PDF specifically for {selectedDonor?.name || 'the donor'}.</p>
                  </div>
                  <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full py-4 text-lg">
                    {loading ? 'Processing...' : 'Generate & Issue'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${file ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="cert-upload" onChange={e=>setFile(e.target.files[0])} />
                    <label htmlFor="cert-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      {file ? <p className="text-purple-700 font-bold">{file.name}</p> : <p className="text-gray-500 font-medium">Click to select file</p>}
                    </label>
                  </div>
                  <button onClick={handleUpload} disabled={loading||!file} className="btn-primary w-full mt-6 py-4 text-lg bg-purple-600 hover:bg-purple-700">
                    {loading ? 'Uploading...' : 'Upload & Issue'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
