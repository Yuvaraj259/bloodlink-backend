import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search, Building2, Shield, Droplets, Phone, MapPin, Award, Menu, X as CloseIcon } from 'lucide-react'
import API from '../utils/api'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [stats, setStats] = useState({ donors: 0, hospitals: 0, livesSaved: 0, bloodGroups: 8 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/admin/public-stats')
        setStats(prev => ({ ...prev, ...res.data }))
      } catch (err) {
        console.error('Failed to fetch public stats:', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navbar */}
      <nav className="bg-white border-b border-red-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Droplets className="text-blood-600 w-7 h-7" />
              <span className="font-display font-bold text-xl text-blood-700">BloodLink</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login/user" className="text-sm font-medium text-gray-600 hover:text-blood-600 px-3 py-2">User Login</Link>
              <Link to="/login/donor" className="text-sm font-medium text-gray-600 hover:text-blood-600 px-3 py-2">Donor Login</Link>
              <Link to="/login/hospital" className="text-sm font-medium text-gray-600 hover:text-blood-600 px-3 py-2">Hospital</Link>
              <Link to="/login/admin" className="btn-primary text-sm py-2 px-4">Admin</Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 p-2">
                {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-red-100 animate-fade-in">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/login/user" className="block px-3 py-3 text-base font-medium text-gray-700 border-b border-gray-50">User Login</Link>
              <Link to="/login/donor" className="block px-3 py-3 text-base font-medium text-gray-700 border-b border-gray-50">Donor Login</Link>
              <Link to="/login/hospital" className="block px-3 py-3 text-base font-medium text-gray-700 border-b border-gray-50">Hospital</Link>
              <Link to="/login/admin" className="block px-3 py-3 text-base font-bold text-blood-600">Admin Portal</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blood-700 via-blood-600 to-blood-800 text-white">
        <style>{`
          .right {
            position: relative; z-index: 2;
            display: flex; align-items: center; justify-content: center;
            height: 360px;
          }
          .drop-scene { position: relative; width: 260px; height: 300px; }

          /* 3D floating drop */
          .drop-3d {
            width: 180px; height: 215px;
            position: absolute; left: 50%; top: 50%;
            transform: translate(-50%,-50%);
            animation: dropFloat 3.5s ease-in-out infinite;
            filter: drop-shadow(0 24px 40px rgba(220,38,38,0.35));
          }
          @keyframes dropFloat {
            0%,100% { transform: translate(-50%,-54%) rotate(-2deg); }
            50%      { transform: translate(-50%,-46%) rotate(2deg); }
          }

          /* Pulse rings */
          .ring {
            position: absolute; left: 50%; top: 55%;
            transform: translate(-50%,-50%);
            border-radius: 50%;
            border: 1.5px solid rgba(220,38,38,0.25);
            animation: ringPulse 3s ease-out infinite;
            pointer-events: none;
          }
          .ring1 { width:220px; height:220px; animation-delay:0s; }
          .ring2 { width:300px; height:300px; animation-delay:0.8s; border-color:rgba(220,38,38,0.15); }
          .ring3 { width:380px; height:380px; animation-delay:1.6s; border-color:rgba(220,38,38,0.07); }
          @keyframes ringPulse {
            0%   { transform: translate(-50%,-50%) scale(0.7); opacity: 1; }
            100% { transform: translate(-50%,-50%) scale(1.2); opacity: 0; }
          }

          /* Orbiting mini drops */
          .orbit {
            position: absolute; left: 50%; top: 55%;
            width: 0; height: 0;
            animation: orbitSpin linear infinite;
          }
          .orbit1 { animation-duration: 6s; }
          .orbit2 { animation-duration: 9s; animation-direction: reverse; }
          .orbit3 { animation-duration: 12s; }
          @keyframes orbitSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

          .mini-drop {
            position: absolute;
            border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
            background: #dc2626;
            animation: miniPulse 2s ease-in-out infinite;
          }
          .md1 { width:14px; height:16px; top:-90px; left:-7px; opacity:0.8; }
          .md2 { width:10px; height:12px; top:-70px; left:-5px; opacity:0.6; animation-delay:.6s; }
          .md3 { width:18px; height:20px; top:-110px; left:-9px; opacity:0.5; animation-delay:1.2s; }
          @keyframes miniPulse {
            0%,100% { transform: scale(1); }
            50%      { transform: scale(1.15); }
          }

          /* Floating stat badges */
          .badge {
            position: absolute;
            background: rgba(255,255,255,0.92);
            border: 1px solid rgba(220,38,38,0.15);
            border-radius: 12px; padding: 10px 14px;
            box-shadow: 0 4px 20px rgba(220,38,38,0.1);
            animation: badgeFloat ease-in-out infinite alternate;
            pointer-events: none; white-space: nowrap;
          }
          .badge-num { font-size: 20px; font-weight: 700; color: #dc2626; line-height: 1; }
          .badge-lbl { font-size: 10px; font-weight: 500; color: #9a6060; letter-spacing:.5px; margin-top:2px; }
          .b1 { top:18px; right:-10px; animation-duration:4s; }
          .b2 { top:50%; right:-20px; animation-duration:5s; animation-delay:1s; }
          .b3 { bottom:30px; left:-15px; animation-duration:4.5s; animation-delay:.5s; }
          .b4 { top:22px; left:0; animation-duration:6s; animation-delay:1.5s; }
          @keyframes badgeFloat {
            from { transform: translateY(0); }
            to   { transform: translateY(-10px); }
          }

          /* Heartbeat line */
          .heartbeat-bar {
            position: absolute; bottom: 12px; left: 50%;
            transform: translateX(-50%);
            width: 180px; height: 36px;
          }
          .hb-line {
            stroke: #dc2626; stroke-width: 1.8; fill: none;
            stroke-dasharray: 500;
            animation: hbAnim 2.2s ease-in-out infinite;
          }
          @keyframes hbAnim {
            0%        { stroke-dashoffset: 500; opacity: 0; }
            20%       { opacity: 1; }
            70%       { stroke-dashoffset: 0; opacity: 1; }
            90%,100%  { stroke-dashoffset: 0; opacity: 0; }
          }
        `}</style>

        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random()*80+20+'px', height: Math.random()*80+20+'px',
              top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: Math.random()*0.5
            }} />
          ))}
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm mb-6">
              <Heart className="w-4 h-4 animate-pulse-red" /> Real-time Blood Donation Network
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Every Drop <br /><span className="text-red-200">Saves a Life</span>
            </h1>
            <p className="text-red-100 text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 mb-10">
              Connect blood donors with patients in need. Instant emergency alerts, real-time tracking, and a verified donor network across your city.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register/donor" className="bg-white text-blood-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-all shadow-lg text-lg text-center">
                Become a Donor
              </Link>
              <Link to="/register/user" className="bg-blood-800 border-2 border-white/50 text-white font-bold px-8 py-4 rounded-xl hover:bg-blood-900 transition-all text-lg text-center">
                Find Blood Now
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="right">
              <div className="drop-scene">
                {/* Pulse rings */}
                <div className="ring ring1"></div>
                <div className="ring ring2"></div>
                <div className="ring ring3"></div>

                {/* Orbiting mini drops */}
                <div className="orbit orbit1"><div className="mini-drop md1"></div></div>
                <div className="orbit orbit2"><div className="mini-drop md2"></div></div>
                <div className="orbit orbit3"><div className="mini-drop md3"></div></div>

                {/* 3D Blood Drop SVG */}
                <svg className="drop-3d" viewBox="0 0 180 215" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="dropGrad" cx="38%" cy="32%" r="65%">
                      <stop offset="0%" stop-color="#ff6666"/>
                      <stop offset="45%" stop-color="#dc2626"/>
                      <stop offset="100%" stop-color="#7f0000"/>
                    </radialGradient>
                    <radialGradient id="shineGrad" cx="40%" cy="30%" r="55%">
                      <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
                      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                    </radialGradient>
                  </defs>
                  {/* Drop body */}
                  <path d="M90 6 C90 6 18 78 18 130 C18 170 50 208 90 208 C130 208 162 170 162 130 C162 78 90 6 90 6 Z"
                        fill="url(#dropGrad)"/>
                  {/* Shine */}
                  <ellipse cx="68" cy="85" rx="22" ry="34" fill="url(#shineGrad)" transform="rotate(-22 68 85)"/>
                  <circle cx="62" cy="66" r="5" fill="rgba(255,255,255,0.5)"/>
                  {/* Medical cross */}
                  <rect x="83" y="118" width="14" height="42" rx="4" fill="rgba(255,255,255,0.22)"/>
                  <rect x="69" y="132" width="42" height="14" rx="4" fill="rgba(255,255,255,0.22)"/>
                </svg>

                {/* Heartbeat */}
                <div className="heartbeat-bar">
                  <svg viewBox="0 0 180 36" style={{width:'100%',height:'100%'}}>
                    <polyline className="hb-line"
                      points="0,18 25,18 38,4 48,32 58,6 68,28 78,18 180,18"/>
                  </svg>
                </div>

                {/* Stat badges */}
                <div className="badge b1">
                  <div className="badge-num">{stats.donors.toLocaleString()}+</div>
                  <div className="badge-lbl">Registered Donors</div>
                </div>
                <div className="badge b2">
                  <div className="badge-num">24/7</div>
                  <div className="badge-lbl">Emergency Support</div>
                </div>
                <div className="badge b3">
                  <div className="badge-num">{stats.livesSaved.toLocaleString()}+</div>
                  <div className="badge-lbl">Lives Saved Impact</div>
                </div>
                <div className="badge b4">
                  <div className="badge-num">{stats.hospitals.toLocaleString()}+</div>
                  <div className="badge-lbl">Partner Hospitals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blood-50 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { num: `${stats.donors.toLocaleString()}+`, label: 'Registered Donors' },
            { num: `${stats.hospitals.toLocaleString()}+`, label: 'Partner Hospitals' },
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
