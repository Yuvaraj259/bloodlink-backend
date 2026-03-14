import { Link } from 'react-router-dom'
import { Heart, Search, Building2, Shield, Droplets, Phone, MapPin, Award } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navbar */}
      <nav className="bg-white border-b border-red-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Droplets className="text-blood-600 w-7 h-7" />
            <span className="font-display font-bold text-xl text-blood-700">BloodLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login/user" className="text-sm font-medium text-gray-600 hover:text-blood-600 transition-colors px-3 py-2">User Login</Link>
            <Link to="/login/donor" className="text-sm font-medium text-gray-600 hover:text-blood-600 transition-colors px-3 py-2">Donor Login</Link>
            <Link to="/login/hospital" className="text-sm font-medium text-gray-600 hover:text-blood-600 transition-colors px-3 py-2">Hospital</Link>
            <Link to="/login/admin" className="btn-primary text-sm py-2 px-4">Admin</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blood-700 via-blood-600 to-blood-800 text-white">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random()*80+20+'px', height: Math.random()*80+20+'px',
              top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: Math.random()*0.5
            }} />
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <Heart className="w-4 h-4 animate-pulse-red" /> Real-time Blood Donation Network
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Every Drop <br /><span className="text-red-200">Saves a Life</span>
          </h1>
          <p className="text-red-100 text-xl max-w-2xl mx-auto mb-10">
            Connect blood donors with patients in need. Instant emergency alerts, real-time tracking, and a verified donor network across your city.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/donor" className="bg-white text-blood-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-all shadow-lg text-lg">
              Become a Donor
            </Link>
            <Link to="/register/user" className="bg-blood-800 border-2 border-white/50 text-white font-bold px-8 py-4 rounded-xl hover:bg-blood-900 transition-all text-lg">
              Find Blood Now
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blood-50 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { num: '10,000+', label: 'Registered Donors' },
            { num: '500+', label: 'Partner Hospitals' },
            { num: '8 Types', label: 'Blood Groups Covered' },
            { num: '24/7', label: 'Emergency Support' },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="text-3xl font-display font-bold text-blood-600">{s.num}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="font-display text-4xl font-bold text-center text-gray-900 mb-4">How BloodLink Works</h2>
        <p className="text-center text-gray-500 mb-12">A complete ecosystem connecting donors, patients, and hospitals</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, title: 'Search Donors', desc: 'Find donors by blood type and location within 10km radius instantly.', color: 'text-blue-600 bg-blue-50' },
            { icon: Phone, title: 'Emergency Alerts', desc: 'Send real-time SMS + in-app alerts to multiple donors simultaneously.', color: 'text-red-600 bg-red-50' },
            { icon: MapPin, title: 'Live Tracking', desc: "Track donor's live location once they accept your blood request.", color: 'text-green-600 bg-green-50' },
            { icon: Award, title: 'Certificates', desc: 'Donors receive digital certificates for every donation they make.', color: 'text-purple-600 bg-purple-50' },
            { icon: Building2, title: 'Hospital Portal', desc: 'Hospitals and bootcamps can register donors and manage donations.', color: 'text-orange-600 bg-orange-50' },
            { icon: Shield, title: 'Privacy First', desc: 'Donor contact revealed only after permission flow — fully secure.', color: 'text-teal-600 bg-teal-50' },
            { icon: Heart, title: 'Donation History', desc: 'Track every donation with full history and 3-month cooldown management.', color: 'text-pink-600 bg-pink-50' },
            { icon: Droplets, title: 'Admin Control', desc: 'Full admin portal to approve donors, hospitals, and monitor all activity.', color: 'text-blood-600 bg-blood-50' },
          ].map((f) => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal Cards */}
      <section className="bg-blood-600 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-white mb-10">
          <h2 className="font-display text-4xl font-bold mb-3">Choose Your Portal</h2>
          <p className="text-red-200">Register for the right role to get started</p>
        </div>
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            { title: 'I Need Blood', desc: 'Search donors, send emergency requests, track donations', registerTo: '/register/user', loginTo: '/login/user', icon: Search },
            { title: 'I Want to Donate', desc: 'Register as a donor, receive alerts, track your donations', registerTo: '/register/donor', loginTo: '/login/donor', icon: Heart },
            { title: 'Hospital / Bootcamp', desc: 'Register donors, upload certificates, manage your blood drive', registerTo: '/register/hospital', loginTo: '/login/hospital', icon: Building2 },
          ].map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-6 text-gray-900">
              <p.icon className="w-8 h-8 text-blood-600 mb-3" />
              <h3 className="font-display font-bold text-xl mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 mb-5">{p.desc}</p>
              <div className="flex flex-col gap-2">
                <Link to={p.registerTo} className="btn-primary text-center text-sm">Register</Link>
                <Link to={p.loginTo} className="btn-secondary text-center text-sm">Login</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Droplets className="text-blood-500 w-5 h-5" />
          <span className="font-display font-bold text-white text-lg">BloodLink</span>
        </div>
        <p>Connecting donors with patients in real time. Every donation matters.</p>
        <p className="mt-2 text-xs text-gray-600">© 2026 BloodLink. Built for CodeFiesta 6.0 Hackathon</p>
      </footer>
    </div>
  )
}
