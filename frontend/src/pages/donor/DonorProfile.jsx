// Donor Profile
import { useState } from 'react'
import { toast } from 'react-toastify'
import { User, Heart, Award, Clock, Bell, Droplets, Save, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

const links = [
  { to: '/donor', label: 'Dashboard', icon: Droplets },
  { to: '/donor/profile', label: 'My Profile', icon: User },
  { to: '/donor/history', label: 'Donation History', icon: Clock },
  { to: '/donor/certificates', label: 'Certificates', icon: Award },
  { to: '/donor/requests', label: 'Blood Requests', icon: Bell },
]

export default function DonorProfile() {
  const { auth } = useAuth()
  const donor = auth?.donor
  const [form, setForm] = useState({
    name: donor?.name || '', phone: donor?.phone || '', age: donor?.age || '',
    gender: donor?.gender || 'Male', city: donor?.location?.city || '',
    address: donor?.location?.address || '', isAvailable: donor?.isAvailable ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await API.put('/donors/profile', { ...form, location: { city: form.city, address: form.address } })
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Donor">
      <div className="animate-fade-in max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-red-100">
            <div className="w-16 h-16 rounded-full bg-blood-600 text-white text-2xl font-bold flex items-center justify-center">
              {donor?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{donor?.name}</h2>
              <p className="text-gray-500 text-sm">{donor?.email}</p>
              <span className="badge-blood">{donor?.bloodGroup}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="label">Age</label><input className="input" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} /></div>
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
            <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="label mb-0">Available for Donation</label>
            <button onClick={()=>setForm({...form,isAvailable:!form.isAvailable})}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isAvailable?'bg-green-500':'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAvailable?'translate-x-7':'translate-x-1'}`} />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
            <Save className="w-4 h-4" />{saving?'Saving...':'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
