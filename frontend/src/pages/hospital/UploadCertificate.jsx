import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Award, Upload, FileText, Users, UserPlus, Building2, BarChart3 } from 'lucide-react'
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
  const [selectedDonor, setSelectedDonor] = useState('')
  const [mode, setMode] = useState('generate') // 'generate' | 'upload'
  const [file, setFile] = useState(null)
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    API.get('/hospitals/my-donors').then(r => setDonors(r.data)).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!selectedDonor) return toast.warning('Select a donor first')
    setLoading(true)
    try {
      const res = await API.post(`/certificates/generate/${selectedDonor}`, { donationDate })
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
      const res = await API.post(`/certificates/upload/${selectedDonor}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data.certificateUrl)
      toast.success('Certificate uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Hospital">
      <div className="animate-fade-in max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Issue Certificate</h1>
        <p className="text-gray-500 mb-6">Generate a PDF certificate or upload an existing one for a donor</p>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="font-semibold text-green-800 mb-2">✅ Certificate Ready</p>
            <a href={result} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline break-all">{result}</a>
            <div className="mt-3">
              <a href={result} target="_blank" rel="noreferrer" className="btn-primary text-sm inline-flex items-center gap-2">
                <FileText className="w-4 h-4" /> Open Certificate
              </a>
            </div>
          </div>
        )}

        <div className="card">
          <div className="mb-6">
            <label className="label">Select Donor *</label>
            <select className="input" value={selectedDonor} onChange={e=>setSelectedDonor(e.target.value)} required>
              <option value="">Choose a donor...</option>
              {donors.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.bloodGroup}) — {d.location?.city}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="label">Donation Date</label>
            <input className="input" type="date" value={donationDate} onChange={e=>setDonationDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            <button onClick={()=>setMode('generate')} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode==='generate'?'bg-blood-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <FileText className="w-4 h-4 inline mr-2" />Generate PDF
            </button>
            <button onClick={()=>setMode('upload')} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode==='upload'?'bg-blood-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Upload className="w-4 h-4 inline mr-2" />Upload Existing
            </button>
          </div>

          {mode === 'generate' ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">A professionally designed PDF certificate will be generated and sent to the donor.</p>
              <button onClick={handleGenerate} disabled={loading||!selectedDonor} className="btn-primary w-full flex items-center justify-center gap-2">
                <Award className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Certificate'}
              </button>
            </div>
          ) : (
            <div>
              <label className="label">Upload Certificate File (PDF/Image)</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file?'border-blood-400 bg-blood-50':'border-gray-300 hover:border-blood-300'}`}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="cert-upload" onChange={e=>setFile(e.target.files[0])} />
                <label htmlFor="cert-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  {file ? <p className="text-blood-600 font-medium">{file.name}</p> : <p className="text-gray-500 text-sm">Click to select PDF or image</p>}
                </label>
              </div>
              <button onClick={handleUpload} disabled={loading||!selectedDonor||!file} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                {loading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
