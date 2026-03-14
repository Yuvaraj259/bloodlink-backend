import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
})

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem('bloodlink_auth')
  if (stored) {
    const { token } = JSON.parse(stored)
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API
