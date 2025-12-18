import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [activeServer, setActiveServer] = useState(null)

  // Configurar token no axios
  useEffect(() => {
    if (token) {
      // Verificar se o token tem formato válido (JWT tem 3 partes separadas por ponto)
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        console.error('Token inválido: formato incorreto')
        logout()
        return
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.status === 'success') {
        setUser(response.data.data)
        await loadActiveServer()
      } else {
        // Se não conseguir carregar usuário, fazer logout
        logout()
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      // Se for erro 401 ou 422, fazer logout
      if (error.response?.status === 401 || error.response?.status === 422) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  const loadActiveServer = async () => {
    try {
      const response = await api.get('/servers/active')
      if (response.data.status === 'success') {
        setActiveServer(response.data.data)
      } else {
        setActiveServer(null)
      }
    } catch (error) {
      // 404 é esperado se não houver servidor ativo - não logar como erro
      if (error.response?.status === 404) {
        setActiveServer(null)
        // Não logar 404 como erro, é comportamento esperado
      } else if (error.response?.status !== 401 && error.response?.status !== 422) {
        // Só logar se não for erro de autenticação
        console.error('Erro ao carregar servidor ativo:', error)
        setActiveServer(null)
      } else {
        setActiveServer(null)
      }
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      if (response.data.status === 'success' && response.data.data) {
        const { token: newToken, user: userData } = response.data.data
        
        // Validar token antes de salvar
        if (!newToken || typeof newToken !== 'string') {
          console.error('Token inválido recebido do servidor')
          return { success: false, error: 'Token inválido recebido' }
        }
        
        const tokenParts = newToken.split('.')
        if (tokenParts.length !== 3) {
          console.error('Token malformado:', newToken)
          return { success: false, error: 'Token malformado' }
        }
        
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        await loadActiveServer()
        return { success: true }
      }
      return { success: false, error: 'Erro ao fazer login' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      })
      if (response.data.status === 'success' && response.data.data) {
        const { token: newToken, user: userData } = response.data.data
        
        // Validar token antes de salvar
        if (!newToken || typeof newToken !== 'string') {
          console.error('Token inválido recebido do servidor')
          return { success: false, error: 'Token inválido recebido' }
        }
        
        const tokenParts = newToken.split('.')
        if (tokenParts.length !== 3) {
          console.error('Token malformado:', newToken)
          return { success: false, error: 'Token malformado' }
        }
        
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        await loadActiveServer()
        return { success: true }
      }
      return { success: false, error: 'Erro ao registrar' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar'
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setActiveServer(null)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const activateServer = async (serverId) => {
    try {
      const response = await api.post(`/servers/${serverId}/activate`)
      if (response.data.status === 'success') {
        setActiveServer(response.data.data)
        return { success: true }
      }
      return { success: false, error: 'Erro ao ativar servidor' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao ativar servidor'
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    activeServer,
    login,
    register,
    logout,
    activateServer,
    loadActiveServer
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

