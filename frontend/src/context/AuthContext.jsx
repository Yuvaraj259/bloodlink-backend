import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null)        // { token, user/donor/hospital, type }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('bloodlink_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      setAuth(parsed)
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('bloodlink_auth', JSON.stringify(data))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setAuth(data)
  }

  const logout = () => {
    localStorage.removeItem('bloodlink_auth')
    delete axios.defaults.headers.common['Authorization']
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
