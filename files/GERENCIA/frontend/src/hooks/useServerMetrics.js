import { useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import api from '../services/api'

export const useServerMetrics = (interval = 2000) => {
  const { socket, connected } = useWebSocket()
  const [metrics, setMetrics] = useState({
    cpu: null,
    memory: null,
    disk: null,
    network: null,
    system: null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const response = await api.get('/monitoring/all', {
          params: { interval: interval / 1000 }
        })
        
        if (response.data.status === 'success') {
          setMetrics(response.data.data)
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error)
      } finally {
        setLoading(false)
      }
    }

    // Buscar imediatamente (não depende do WebSocket)
    fetchMetrics()

    // Configurar intervalo para buscar métricas periodicamente
    const intervalId = setInterval(fetchMetrics, interval)

    // Escutar atualizações via WebSocket (opcional - apenas se conectado)
    if (socket && connected) {
      socket.emit('subscribe_server_metrics')
      
      socket.on('server_metrics_update', (data) => {
        setMetrics(data)
      })
    }

    return () => {
      clearInterval(intervalId)
      if (socket) {
        socket.off('server_metrics_update')
      }
    }
  }, [interval, socket, connected])

  return { metrics, loading }
}

