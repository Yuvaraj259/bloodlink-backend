import { useState } from 'react'
import { toast } from 'react-toastify'
import { User, Droplets, Search, Building2, Clock, Heart, Save } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

const links = [
  { to: '/user', label: 'Dashboard', icon: Droplets },
  { to: '/user/search', label: 'Search Donors', icon: Search },
  { to: '/user/emergency', label: 'Emergency Centers', icon: Building2 },
  { to: '/user/requests', label: 'My Requests', icon: Clock },
  { to: '/user/profile', label: 'My Profile', icon: Heart },
]

export default function UserProfile() {
  const { auth, login } = useAuth()
  const user = auth?.user
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', bloodGroup: user?.bloodGroup||'', city: user?.location?.city||'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await API.put('/donors/profile', { ...form, location: { city: form.city } })
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="User">
      <div className="animate-fade-in max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

        <div className="card mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blood-600 text-white font-bold text-xl flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-xl text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="badge-blood mt-1">{user?.bloodGroup || 'No blood group set'}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="label">Blood Group</label>
              <select className="input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
            <Save className="w-4 h-4" />{saving?'Saving...':'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
