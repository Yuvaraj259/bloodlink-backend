// src/pages/auth/UserLogin.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Droplets, Eye, EyeOff, FileText, Upload, CheckCircle2 } from 'lucide-react'
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
      login({ token: res.data.token, user: res.data.user, type: 'user' })
      if (res.data.user.role === 'admin') navigate('/admin')
      else navigate('/user')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return <AuthCard title="User Login" subtitle="Find blood donors near you">
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} placeholder="Enter your email" onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input className="input pr-10" type={showPw?'text':'password'} value={form.password} placeholder="••••••••" onChange={e=>setForm({...form,password:e.target.value})} required />
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg mt-2">{loading?'Logging in...':'Login'}</button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-500">New user? <Link to="/register/user" className="text-blood-600 font-semibold hover:underline">Register here</Link></p>
      <AuthLinks current="user" />
    </div>
  </AuthCard>
}

export function UserRegister() {
  const [form, setForm] = useState({ name:'',email:'',confirmEmail:'',password:'',phone:'',bloodGroup:'',city:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const validatePassword = (pw) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (form.email !== form.confirmEmail) return toast.error("Emails do not match");
    if (!validatePassword(form.password)) return toast.error("Password must be 8+ chars, with uppercase, lowercase, number and special character");
    
    setLoading(true)
    try {
      const { confirmEmail, ...submitData } = form;
      const res = await API.post('/auth/user/register', { ...submitData, location: { city: form.city } })
      login({ token: res.data.token, user: res.data.user, type: 'user' })
      toast.success('Welcome to BloodLink!')
      navigate('/user')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="User Registration" subtitle="Join as a blood seeker">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit #" required /></div>
      </div>
      <div><label className="label">Email Address</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="john@example.com" required /></div>
      <div><label className="label">Confirm Email</label><input className="input" type="email" value={form.confirmEmail} onChange={e=>setForm({...form,confirmEmail:e.target.value})} placeholder="Repeat email" required /></div>
      <div>
        <label className="label">Create Password</label>
        <input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 8 chars, 1 Upper, 1 Special" required />
        <p className="text-[10px] text-gray-400 mt-1">Must include uppercase, number & special char.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Blood Group</label>
          <select className="input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} required>
            <option value="">Select Group</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Your city" required /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">{loading?'Creating account...':'Create Account'}</button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-500">Already have an account? <Link to="/login/user" className="text-blood-600 font-semibold hover:underline">Login here</Link></p>
      <AuthLinks current="user" />
    </div>
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="label">Donor Email</label><input className="input" type="email" value={form.email} placeholder="Enter donor email" onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} placeholder="••••••••" onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">{loading?'Logging in...':'Login as Donor'}</button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-500">New donor? <Link to="/register/donor" className="text-blood-600 font-semibold hover:underline">Register as Donor</Link></p>
      <AuthLinks current="donor" />
    </div>
  </AuthCard>
}

export function DonorRegister() {
  const [form, setForm] = useState({ name:'',email:'',confirmEmail:'',password:'',phone:'',bloodGroup:'',age:'',gender:'Male',city:'',address:'' })
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validatePassword = (pw) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email !== form.confirmEmail) return toast.error("Emails do not match");
    if (!validatePassword(form.password)) return toast.error("Password must be 8+ chars, with uppercase, lowercase, number and special character");

    if (!certificate) return toast.error("Please upload your health certificate for verification");

    setLoading(true)
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'confirmEmail' && key !== 'city' && key !== 'address') {
          formData.append(key, form[key]);
        }
      });
      formData.append('location', JSON.stringify({ city: form.city, address: form.address }));
      formData.append('certificate', certificate);

      await API.post('/auth/donor/register', formData);

      toast.success('Registration submitted! Wait for admin approval.')
      navigate('/login/donor')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Donor Registration" subtitle="Register to start saving lives">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone #" required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Email Address</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="donor@example.com" required /></div>
        <div><label className="label">Confirm Email</label><input className="input" type="email" value={form.confirmEmail} onChange={e=>setForm({...form,confirmEmail:e.target.value})} placeholder="Repeat email" required /></div>
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 8 chars, 1 Upper, 1 Special" required />
      </div>
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
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
        <div><label className="label">Address (Optional)</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
      </div>

      <div className="space-y-2">
        <label className="label">Health Certificate (Proof of Fitness)</label>
        <div className="relative group">
          <input 
            type="file" 
            id="cert-upload" 
            className="hidden" 
            accept="image/*,.pdf" 
            onChange={e => setCertificate(e.target.files[0])} 
          />
          <label 
            htmlFor="cert-upload" 
            className={`flex items-center justify-between w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              certificate 
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700' 
              : 'border-gray-200 bg-gray-50 text-gray-400 group-hover:border-blood-300 group-hover:bg-blood-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {certificate ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Upload className="w-5 h-5" />}
              <span className="text-sm font-medium truncate max-w-[200px]">
                {certificate ? certificate.name : 'Upload Certificate (JPG, PNG, PDF)'}
              </span>
            </div>
            {!certificate && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-2 py-1 rounded">Choose</span>}
          </label>
        </div>
        <p className="text-[10px] text-gray-400 italic">Mandatory for verification. Max 5MB.</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
        {loading ? 'Submitting Application...' : 'Register for Review'}
      </button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-500">Already registered? <Link to="/login/donor" className="text-blood-600 font-semibold hover:underline">Login here</Link></p>
      <AuthLinks current="donor" />
    </div>
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

  return <AuthCard title="Hospital Login" subtitle="Manage your blood requests">
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="label">Hospital Email</label><input className="input" type="email" value={form.email} placeholder="Enter hospital email" onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} placeholder="••••••••" onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">{loading?'Logging in...':'Login'}</button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-500">Not registered? <Link to="/register/hospital" className="text-blood-600 font-semibold hover:underline">Register here</Link></p>
      <AuthLinks current="hospital" />
    </div>
  </AuthCard>
}

export function HospitalRegister() {
  const [form, setForm] = useState({ name:'',email:'',confirmEmail:'',password:'',phone:'',type:'hospital',address:'',city:'',state:'',pincode:'',licenseNumber:'',contactPerson:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validatePassword = (pw) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email !== form.confirmEmail) return toast.error("Emails do not match");
    if (!validatePassword(form.password)) return toast.error("Password must be 8+ chars, with uppercase, lowercase, number and special character");

    setLoading(true)
    try {
      const { confirmEmail, ...submitData } = form;
      await API.post('/auth/hospital/register', submitData)
      toast.success('Application submitted! Admin will review and approve.')
      navigate('/login/hospital')
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return <AuthCard title="Hospital Registration" subtitle="Join BloodLink network">
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Org Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
        <div><label className="label">Type</label>
          <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            <option value="hospital">Hospital</option>
            <option value="bootcamp">Blood Bootcamp</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
        <div><label className="label">Confirm Email</label><input className="input" type="email" value={form.confirmEmail} onChange={e=>setForm({...form,confirmEmail:e.target.value})} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Strong password" required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
      </div>
      <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></div>
        <div><label className="label">State</label><input className="input" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} /></div>
        <div><label className="label">Pin</label><input className="input" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">License #</label><input className="input" value={form.licenseNumber} onChange={e=>setForm({...form,licenseNumber:e.target.value})} /></div>
        <div><label className="label">Contact</label><input className="input" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">{loading?'Submitting...':'Submit Application'}</button>
    </form>
    <div className="mt-6 text-center">
      <AuthLinks current="hospital" />
    </div>
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

  return <AuthCard title="Admin Login" subtitle="BloodLink system administration">
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="label">Admin Email</label><input className="input" type="email" value={form.email} placeholder="admin@bloodlink.com" onChange={e=>setForm({...form,email:e.target.value})} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={form.password} placeholder="••••••••" onChange={e=>setForm({...form,password:e.target.value})} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">{loading?'Authenticating...':'Admin Access'}</button>
    </form>
    <div className="mt-6 text-center">
      <Link to="/" className="text-sm font-medium text-gray-400 hover:text-blood-600 transition-colors">← Back to Home</Link>
      <AuthLinks current="admin" />
    </div>
  </AuthCard>
}

// Shared AuthCard wrapper
function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[10%] right-[5%] w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blood-50 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/50">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-white rounded-full shadow-sm border border-gray-50 hover:shadow-md transition-all mb-8">
              <Droplets className="text-blood-600 w-6 h-6" />
              <span className="font-display font-bold text-xl text-blood-700 tracking-tight">BloodLink</span>
            </Link>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 font-medium tracking-wide">{subtitle}</p>
          </div>
          
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthLinks({ current }) {
  return (
    <div className="border-t border-gray-100 mt-8 pt-6">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4">Other Portals</p>
      <div className="flex items-center justify-center gap-4">
        {['user', 'donor', 'hospital', 'admin'].filter(p => p !== current).map((p, idx, arr) => (
          <div key={p} className="flex items-center">
            <Link to={p === 'admin' ? '/login/admin' : `/login/${p}`} className="text-xs font-bold text-gray-400 hover:text-blood-600 transition-colors backdrop-blur-sm">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Link>
            {idx < arr.length - 1 && <div className="w-1 h-1 rounded-full bg-gray-200 mx-4"></div>}
          </div>
        ))}
      </div>
    </div>
  )
}
