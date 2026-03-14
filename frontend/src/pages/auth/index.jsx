// src/pages/auth/UserLogin.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Droplets, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import API from '../../utils/api'

export function UserLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.post('/auth/user/login', form)
      login({ token: res.data.token, user: res.data.user, type: res.data.user.role === 'admin' ? 'user' : 'user' })
      if (res.data.user.role === 'admin') navigate('/admin')
      else navigate('/user')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return <AuthCard title="User Login" subtitle="Find blood donors near you">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label>
        <div className="relative"><input className="input pr-10" type={showPw?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Logging in...':'Login'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-4">New user? <Link to="/register/user" className="text-blood-600 font-medium">Register here</Link></p>
    <div className="border-t border-red-100 mt-4 pt-4 space-y-2 text-center">
      <p className="text-xs text-gray-400">Other portals:</p>
      <div className="flex gap-2 justify-center">
        <Link to="/login/donor" className="text-xs text-blood-600 hover:underline">Donor</Link>
        <span className="text-gray-300">|</span>
        <Link to="/login/hospital" className="text-xs text-blood-600 hover:underline">Hospital</Link>
        <span className="text-gray-300">|</span>
        <Link to="/login/admin" className="text-xs text-blood-600 hover:underline">Admin</Link>
      </div>
    </div>
  </AuthCard>
}

export function UserRegister() {
  const [form, setForm] = useState({ name:'',email:'',password:'',phone:'',bloodGroup:'',city:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await API.post('/auth/user/register', { ...form, location: { city: form.city } })
      login({ token: res.data.token, user: res.data.user, type: 'user' })
      toast.success('Welcome to BloodLink!')
      navigate('/user')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Create Account" subtitle="Join as a blood seeker / user">
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Blood Group</label>
          <select className="input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">{loading?'Creating account...':'Register'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link to="/login/user" className="text-blood-600 font-medium">Login</Link></p>
  </AuthCard>
}

export function DonorLogin() {
  const [form, setForm] = useState({ email:'',password:'' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await API.post('/auth/donor/login', form)
      login({ token: res.data.token, donor: res.data.donor, type: 'donor' })
      navigate('/donor')
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Donor Login" subtitle="Login to manage your donations">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Logging in...':'Login as Donor'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-4">New donor? <Link to="/register/donor" className="text-blood-600 font-medium">Register here</Link></p>
  </AuthCard>
}

export function DonorRegister() {
  const [form, setForm] = useState({ name:'',email:'',password:'',phone:'',bloodGroup:'',age:'',gender:'Male',city:'',address:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await API.post('/auth/donor/register', { ...form, location: { city: form.city, address: form.address } })
      toast.success('Registration submitted! Wait for admin approval.')
      navigate('/login/donor')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Become a Donor" subtitle="Register to start saving lives">
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">Blood Group</label>
          <select className="input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} required>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="label">Age</label><input className="input" type="number" min="18" max="65" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required /></div>
        <div><label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
            {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
        <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Submitting...':'Register as Donor'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-3">Already registered? <Link to="/login/donor" className="text-blood-600 font-medium">Login</Link></p>
  </AuthCard>
}

export function HospitalLogin() {
  const [form, setForm] = useState({ email:'',password:'' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await API.post('/auth/hospital/login', form)
      login({ token: res.data.token, hospital: res.data.hospital, type: 'hospital' })
      navigate('/hospital')
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Hospital / Bootcamp Login" subtitle="Manage your blood drive portal">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Logging in...':'Login'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-4">Not registered? <Link to="/register/hospital" className="text-blood-600 font-medium">Register here</Link></p>
  </AuthCard>
}

export function HospitalRegister() {
  const [form, setForm] = useState({ name:'',email:'',password:'',phone:'',type:'hospital',address:'',city:'',state:'',pincode:'',licenseNumber:'',contactPerson:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await API.post('/auth/hospital/register', form)
      toast.success('Application submitted! Admin will review and approve.')
      navigate('/login/hospital')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Hospital / Bootcamp Registration" subtitle="Join BloodLink as a blood drive partner">
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Organization Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div><label className="label">Type</label>
          <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option value="hospital">Hospital</option>
            <option value="bootcamp">Blood Bootcamp</option>
          </select>
        </div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
      </div>
      <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
        <div><label className="label">State</label><input className="input" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} /></div>
        <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">License Number</label><input className="input" value={form.licenseNumber} onChange={e=>setForm({...form,licenseNumber:e.target.value})} /></div>
        <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Submitting...':'Submit for Approval'}</button>
    </form>
  </AuthCard>
}

export function AdminLogin() {
  const [form, setForm] = useState({ email:'',password:'' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await API.post('/auth/admin/login', form)
      login({ token: res.data.token, user: res.data.user, type: 'user' })
      navigate('/admin')
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid admin credentials') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Admin Login" subtitle="BloodLink system administration" accent>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Admin Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Authenticating...':'Admin Login'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-4"><Link to="/" className="text-blood-600">← Back to Home</Link></p>
  </AuthCard>
}

// Shared AuthCard wrapper
function AuthCard({ title, subtitle, children, accent }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blood-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Droplets className="text-blood-600 w-7 h-7" />
            <span className="font-display font-bold text-2xl text-blood-700">BloodLink</span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className={`bg-white rounded-2xl shadow-lg p-8 border ${accent ? 'border-blood-200' : 'border-red-100'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
