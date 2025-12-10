import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export const useWebSocket = (url = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'], // Permitir polling como fallback
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    })

    socketRef.current.on('connect', () => {
      console.log('WebSocket conectado')
      setConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket desconectado')
      setConnected(false)
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error)
      setConnected(false)
    })

    setSocket(socketRef.current)

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [url])

  return { socket, connected }
}

