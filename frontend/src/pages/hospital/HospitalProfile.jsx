import { useState } from 'react'
import { toast } from 'react-toastify'
import { Building2, Save, Users, UserPlus, Award, BarChart3 } from 'lucide-react'
import DashboardLayout from '../../components/Shared/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

const links = [
  { to: '/hospital', label: 'Dashboard', icon: BarChart3 },
  { to: '/hospital/register-donor', label: 'Register Donor', icon: UserPlus },
  { to: '/hospital/donors', label: 'My Donors', icon: Users },
  { to: '/hospital/certificates', label: 'Upload Certificate', icon: Award },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

export default function HospitalProfile() {
  const { auth } = useAuth()
  const h = auth?.hospital
  const [form, setForm] = useState({
    name: h?.name||'', phone: h?.phone||'', address: h?.address||'',
    city: h?.city||'', state: h?.state||'', pincode: h?.pincode||'',
    contactPerson: h?.contactPerson||'', website: h?.website||'',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await API.put('/hospitals/profile', form)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout links={links} portalLabel="Hospital">
      <div className="animate-fade-in max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">Organization Profile</h1>
        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-red-100">
            <div className="w-14 h-14 rounded-xl bg-blood-100 text-blood-700 font-bold text-2xl flex items-center justify-center">
              {h?.type === 'hospital' ? '🏥' : '🩸'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{h?.name}</h2>
              <p className="text-gray-500 text-sm">{h?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h?.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {h?.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Organization Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
            <div><label className="label">State</label><input className="input" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} /></div>
            <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})} /></div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})} /></div>
            <div className="col-span-2"><label className="label">Website</label><input className="input" type="url" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} /></div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
            <Save className="w-4 h-4" />{saving?'Saving...':'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
