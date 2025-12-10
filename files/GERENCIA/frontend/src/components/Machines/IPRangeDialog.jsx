import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box
} from '@mui/material'
import { toast } from 'react-toastify'
import api from '../../services/api'

const IPRangeDialog = ({ open, onClose, onSuccess }) => {
  const [ipRange, setIPRange] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!ipRange.includes(' - ')) {
      toast.error('Formato inválido. Use: 10.100.64.100 - 10.100.64.150')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/machines/setup-range', { range: ipRange })
      
      if (response.data.status === 'success') {
        toast.success(`Faixa de IPs configurada: ${response.data.data.count} máquinas`)
        setIPRange('')
        onSuccess()
      }
    } catch (error) {
      toast.error('Erro ao configurar faixa de IPs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configurar Faixa de IPs</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Informe a faixa de IPs do laboratório:
        </Typography>
        <TextField
          fullWidth
          label="Faixa de IPs"
          placeholder="Ex: 10.100.64.100 - 10.100.64.150"
          value={ipRange}
          onChange={(e) => setIPRange(e.target.value)}
          sx={{ mt: 2 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Após confirmar, o sistema será configurado e o monitoramento poderá ser iniciado.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !ipRange}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default IPRangeDialog

