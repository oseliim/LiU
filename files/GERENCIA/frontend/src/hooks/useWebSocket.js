import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'

export const useWebSocket = (customUrl = null) => {
  const { activeServer } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  // Determinar URL do WebSocket
  const getWebSocketUrl = () => {
    if (customUrl) return customUrl
    if (activeServer) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
      return `${protocol}//${activeServer.host}:${activeServer.port}`
    }
    // Fallback para localhost se não houver servidor ativo
    return 'http://localhost:5001'
  }

  useEffect(() => {
    const url = getWebSocketUrl()
    
    // Se não houver URL válida, não conectar
    if (!url || (!activeServer && !customUrl)) {
      setConnected(false)
      return
    }

    // Fechar conexão anterior se existir
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    socketRef.current = io(url, {
      transports: ['websocket', 'polling'], // Permitir polling como fallback
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    })

    socketRef.current.on('connect', () => {
      console.log('WebSocket conectado:', url)
      setConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket desconectado')
      setConnected(false)
    })

    socketRef.current.on('connect_error', (error) => {
      // Só logar erro se não for porque não há servidor ativo
      if (activeServer || customUrl) {
        console.error('Erro de conexão WebSocket:', error)
      }
      setConnected(false)
    })

    setSocket(socketRef.current)

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [activeServer, customUrl])

  return { socket, connected }
}

