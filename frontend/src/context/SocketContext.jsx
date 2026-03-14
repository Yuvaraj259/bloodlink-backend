import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const { auth } = useAuth()

  useEffect(() => {
    if (!auth?.token) return

    const userId = auth.user?._id || auth.donor?._id || auth.hospital?._id
    if (!userId) return

    const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    const socket = io(BACKEND, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socketRef.current = socket

    const register = () => {
      console.log('[Socket] Connected! Registering userId:', userId)
      socket.emit('register', userId)
    }

    socket.on('connect', register)
    socket.on('reconnect', register)
    socket.on('registered', (data) => {
      console.log('[Socket] Registered confirmed:', data)
    })
    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })
    
    // Add debugging for all incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`[Socket] Received event: ${eventName}`, args)
    })

    // Register immediately if already connected
    if (socket.connected) register()

    return () => {
      socket.off('connect', register)
      socket.off('reconnect', register)
      socket.disconnect()
    }
  }, [auth])

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
