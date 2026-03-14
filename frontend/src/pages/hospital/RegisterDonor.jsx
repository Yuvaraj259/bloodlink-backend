import { useState } from 'react'
import { toast } from 'react-toastify'
import { UserPlus, Users, Award, Building2, BarChart3 } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import API from '../../utils/api'

const links = [
  { to: '/hospital', label: 'Dashboard', icon: BarChart3 },
  { to: '/hospital/register-donor', label: 'Register Donor', icon: UserPlus },
  { to: '/hospital/donors', label: 'My Donors', icon: Users },
  { to: '/hospital/certificates', label: 'Upload Certificate', icon: Award },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export default function RegisterDonor() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', bloodGroup:'', age:'', gender:'Male', city:'', address:'' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.post('/donors/register-by-entity', {
        ...form,
        location: { city: form.city, address: form.address }
      })
      setSuccess(res.data.donor)
      setForm({ name:'', email:'', phone:'', bloodGroup:'', age:'', gender:'Male', city:'', address:'' })
      toast.success('Donor registered successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Hospital">
      <div className="animate-fade-in max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Register a Donor</h1>
        <p className="text-gray-500 mb-6">Add a new donor who came to donate blood at your facility</p>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">✅</div>
            <div>
              <p className="font-semibold text-green-800">{success.name} registered successfully!</p>
              <p className="text-sm text-green-600">Blood Group: {success.bloodGroup} | City: {success.location?.city}</p>
            </div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
              <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
            </div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="label">Blood Group *</label>
                <select className="input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} required>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label className="label">Age *</label><input className="input" type="number" min="18" max="65" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required /></div>
              <div><label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                  {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">City *</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
              <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Registering...' : 'Register Donor'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
