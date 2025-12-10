import { useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import { useMachineStore } from '../store/machineStore'
import api from '../services/api'

export const useMachineStatus = () => {
  const { socket, connected } = useWebSocket()
  const { machines, setMachines, updateMachine, setLoading, setError } = useMachineStore()
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Carregar máquinas iniciais
  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true)
      try {
        const response = await api.get('/machines/status')
        if (response.data.status === 'success') {
          setMachines(response.data.data.machines || [])
        }
      } catch (error) {
        setError('Erro ao carregar máquinas')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMachines()
  }, [setMachines, setLoading, setError])

  // Escutar atualizações via WebSocket
  useEffect(() => {
    if (!socket || !connected) return

    const handleStatusUpdate = (data) => {
      updateMachine(data.ip, {
        status: data.status,
        lastSeen: new Date().toISOString()
      })
    }

    socket.on('machine_status_update', handleStatusUpdate)
    socket.emit('subscribe_machines')

    return () => {
      socket.off('machine_status_update', handleStatusUpdate)
    }
  }, [socket, connected, updateMachine])

  const startMonitoring = () => {
    if (socket && connected) {
      socket.emit('start_monitoring')
      setIsMonitoring(true)
    }
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
  }

  const refreshStatus = async () => {
    setLoading(true)
    try {
      const response = await api.get('/machines/status')
      if (response.data.status === 'success') {
        setMachines(response.data.data.machines || [])
      }
    } catch (error) {
      setError('Erro ao atualizar status')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return {
    machines,
    connected,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshStatus
  }
}

