import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

// Pages
import LandingPage from './pages/LandingPage'
import UserLogin from './pages/auth/UserLogin'
import UserRegister from './pages/auth/UserRegister'
import DonorLogin from './pages/auth/DonorLogin'
import DonorRegister from './pages/auth/DonorRegister'
import HospitalLogin from './pages/auth/HospitalLogin'
import HospitalRegister from './pages/auth/HospitalRegister'
import AdminLogin from './pages/auth/AdminLogin'

// Dashboards
import UserDashboard from './pages/user/UserDashboard'
import SearchDonors from './pages/user/SearchDonors'
import EmergencyDashboard from './pages/user/EmergencyDashboard'
import MyRequests from './pages/user/MyRequests'
import UserProfile from './pages/user/UserProfile'

import DonorDashboard from './pages/donor/DonorDashboard'
import DonorProfile from './pages/donor/DonorProfile'
import DonorHistory from './pages/donor/DonorHistory'
import DonorCertificates from './pages/donor/DonorCertificates'
import BloodRequestAlert from './pages/donor/BloodRequestAlert'

import HospitalDashboard from './pages/hospital/HospitalDashboard'
import RegisterDonor from './pages/hospital/RegisterDonor'
import MyDonors from './pages/hospital/MyDonors'
import UploadCertificate from './pages/hospital/UploadCertificate'
import HospitalProfile from './pages/hospital/HospitalProfile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDonors from './pages/admin/AdminDonors'
import AdminHospitals from './pages/admin/AdminHospitals'
import AdminRequests from './pages/admin/AdminRequests'
import AdminUsers from './pages/admin/AdminUsers'

const ProtectedRoute = ({ children, allowedTypes }) => {
  const { auth, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-blood-600 border-t-transparent rounded-full" /></div>
  if (!auth) return <Navigate to="/" replace />
  if (allowedTypes && !allowedTypes.includes(auth.type)) return <Navigate to="/" replace />
  if (auth.type === 'user' && auth.user?.role === 'admin' && !allowedTypes?.includes('admin')) return <Navigate to="/admin" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { auth, loading } = useAuth()
  if (loading) return null
  if (!auth || auth.type !== 'user' || auth.user?.role !== 'admin') return <Navigate to="/login/admin" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/user" element={<UserLogin />} />
            <Route path="/register/user" element={<UserRegister />} />
            <Route path="/login/donor" element={<DonorLogin />} />
            <Route path="/register/donor" element={<DonorRegister />} />
            <Route path="/login/hospital" element={<HospitalLogin />} />
            <Route path="/register/hospital" element={<HospitalRegister />} />
            <Route path="/login/admin" element={<AdminLogin />} />

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedTypes={['user']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/search" element={<ProtectedRoute allowedTypes={['user']}><SearchDonors /></ProtectedRoute>} />
            <Route path="/user/emergency" element={<ProtectedRoute allowedTypes={['user']}><EmergencyDashboard /></ProtectedRoute>} />
            <Route path="/user/requests" element={<ProtectedRoute allowedTypes={['user']}><MyRequests /></ProtectedRoute>} />
            <Route path="/user/profile" element={<ProtectedRoute allowedTypes={['user']}><UserProfile /></ProtectedRoute>} />

            {/* Donor Routes */}
            <Route path="/donor" element={<ProtectedRoute allowedTypes={['donor']}><DonorDashboard /></ProtectedRoute>} />
            <Route path="/donor/profile" element={<ProtectedRoute allowedTypes={['donor']}><DonorProfile /></ProtectedRoute>} />
            <Route path="/donor/history" element={<ProtectedRoute allowedTypes={['donor']}><DonorHistory /></ProtectedRoute>} />
            <Route path="/donor/certificates" element={<ProtectedRoute allowedTypes={['donor']}><DonorCertificates /></ProtectedRoute>} />
            <Route path="/donor/requests" element={<ProtectedRoute allowedTypes={['donor']}><BloodRequestAlert /></ProtectedRoute>} />

            {/* Hospital Routes */}
            <Route path="/hospital" element={<ProtectedRoute allowedTypes={['hospital']}><HospitalDashboard /></ProtectedRoute>} />
            <Route path="/hospital/register-donor" element={<ProtectedRoute allowedTypes={['hospital']}><RegisterDonor /></ProtectedRoute>} />
            <Route path="/hospital/donors" element={<ProtectedRoute allowedTypes={['hospital']}><MyDonors /></ProtectedRoute>} />
            <Route path="/hospital/certificates" element={<ProtectedRoute allowedTypes={['hospital']}><UploadCertificate /></ProtectedRoute>} />
            <Route path="/hospital/profile" element={<ProtectedRoute allowedTypes={['hospital']}><HospitalProfile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/donors" element={<AdminRoute><AdminDonors /></AdminRoute>} />
            <Route path="/admin/hospitals" element={<AdminRoute><AdminHospitals /></AdminRoute>} />
            <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
