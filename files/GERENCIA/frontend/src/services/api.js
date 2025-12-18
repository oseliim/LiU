import axios from 'axios'
import { toast } from 'react-toastify'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Se for erro 401 ou 422 (token inválido/expirado), limpar token
      if (error.response.status === 401 || error.response.status === 422) {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        
        // Não redirecionar aqui para evitar loop, deixar o componente fazer
        // Mas mostrar mensagem de erro
        const message = error.response.data?.error || 'Sessão expirada. Faça login novamente.'
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          toast.error(message)
        }
        return Promise.reject(error)
      }

      // Não mostrar toast para 404 em /servers/active (é esperado)
      if (error.response.status === 404 && error.config?.url?.includes('/servers/active')) {
        return Promise.reject(error)
      }

      const message = error.response.data?.error || error.response.data?.message || 'Erro na requisição'
      toast.error(message)
    } else if (error.request) {
      // Não mostrar toast para timeout se for requisição de status (pode ser normal)
      if (!error.config?.url?.includes('/machines/status')) {
        toast.error('Erro de conexão com o servidor')
      }
    } else {
      toast.error('Erro ao processar requisição')
    }
    return Promise.reject(error)
  }
)

export default api

