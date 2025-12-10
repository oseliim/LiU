import React, { useState, useEffect } from 'react'
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const ServerSelector = () => {
  const { activeServer, activateServer, loadActiveServer } = useAuth()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5000,
    api_key: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      const response = await api.get('/servers')
      if (response.data.status === 'success') {
        setServers(response.data.data.servers)
      }
    } catch (error) {
      console.error('Erro ao carregar servidores:', error)
    }
  }

  const handleServerChange = async (event) => {
    const serverId = event.target.value
    setLoading(true)
    const result = await activateServer(serverId)
    if (result.success) {
      await loadActiveServer()
    }
    setLoading(false)
  }

  const handleCreateServer = async () => {
    setError('')
    
    if (!formData.name || !formData.host) {
      setError('Nome e host são obrigatórios')
      return
    }

    try {
      const response = await api.post('/servers', formData)
      if (response.data.status === 'success') {
        await loadServers()
        await activateServer(response.data.data.id)
        setOpenDialog(false)
        setFormData({ name: '', host: '', port: 5000, api_key: '' })
        setError('')
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar servidor')
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 250 }}>
        <InputLabel>Servidor Ativo</InputLabel>
        <Select
          value={activeServer?.id || ''}
          label="Servidor Ativo"
          onChange={handleServerChange}
          disabled={loading || servers.length === 0}
        >
          {servers.map((server) => (
            <MenuItem key={server.id} value={server.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {server.is_active && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">{server.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {server.host}:{server.port}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {activeServer && (
        <Chip
          label={activeServer.name}
          color="primary"
          size="small"
          icon={<CheckCircleIcon />}
        />
      )}

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
      >
        Adicionar Servidor
      </Button>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false)
          setError('')
          setFormData({ name: '', host: '', port: 5000, api_key: '' })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Novo Servidor</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nome do Servidor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            placeholder="Ex: Servidor Principal"
          />
          <TextField
            fullWidth
            label="Host (IP ou Domínio)"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            margin="normal"
            required
            placeholder="Ex: 192.168.1.100 ou servidor.exemplo.com"
          />
          <TextField
            fullWidth
            label="Porta"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5000 })}
            margin="normal"
            inputProps={{ min: 1, max: 65535 }}
          />
          <TextField
            fullWidth
            label="API Key (Opcional)"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            margin="normal"
            type="password"
            helperText="Chave de autenticação do servidor (se necessário)"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false)
              setError('')
              setFormData({ name: '', host: '', port: 5000, api_key: '' })
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreateServer} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ServerSelector

