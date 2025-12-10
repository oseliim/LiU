import React, { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material'
import {
  Search as SearchIcon,
  PowerSettingsNew as PowerIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useMachineStatus } from '../../hooks/useMachineStatus'
import { useMachineStore } from '../../store/machineStore'
import api from '../../services/api'
import MachineCard from './MachineCard'
import IPRangeDialog from './IPRangeDialog'
import './Machines.css'

const Machines = () => {
  const { machines, refreshStatus, connected } = useMachineStatus()
  const { selectedMachines, setSelectedMachines, toggleMachineSelection } = useMachineStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [ipRangeDialogOpen, setIPRangeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  const filteredMachines = useMemo(() => {
    return machines.filter(machine => {
      const matchesSearch = machine.ip.includes(searchTerm) ||
        (machine.hostname && machine.hostname.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesFilter = filter === 'all' ||
        (filter === 'online' && machine.status === 'online') ||
        (filter === 'offline' && machine.status === 'offline')
      
      return matchesSearch && matchesFilter
    })
  }, [machines, searchTerm, filter])

  const handleTurnOn = async () => {
    setLoading(true)
    try {
      const ips = selectedMachines.length > 0 ? selectedMachines : []
      const response = await api.post('/machines/turn-on', { ips })
      
      if (response.data.status === 'success') {
        toast.success('Comando de ligar enviado com sucesso')
        setSelectedMachines([])
        setTimeout(refreshStatus, 2000)
      }
    } catch (error) {
      toast.error('Erro ao ligar máquinas')
    } finally {
      setLoading(false)
    }
  }

  const handleTurnOff = async () => {
    setLoading(true)
    try {
      if (selectedMachines.length > 0) {
        const response = await api.post('/machines/turn-off', { ips: selectedMachines })
        if (response.data.status === 'success') {
          toast.success('Máquinas selecionadas serão desligadas')
          setSelectedMachines([])
        }
      } else {
        const response = await api.post('/machines/turn-off', {})
        if (response.data.status === 'success') {
          toast.success('Todas as máquinas serão desligadas')
        }
      }
      setTimeout(refreshStatus, 2000)
    } catch (error) {
      toast.error('Erro ao desligar máquinas')
    } finally {
      setLoading(false)
    }
  }

  const handleTurnOffOne = async (ip) => {
    try {
      const response = await api.post(`/machines/${ip}/turn-off`)
      if (response.data.status === 'success') {
        toast.success(`Máquina ${ip} será desligada`)
        setTimeout(refreshStatus, 2000)
      }
    } catch (error) {
      toast.error(`Erro ao desligar máquina ${ip}`)
    }
  }

  const handleInternetControl = async (action) => {
    setLoading(true)
    try {
      const endpoint = action === 'on' ? '/machines/internet/turn-on' : '/machines/internet/turn-off'
      const response = await api.post(endpoint)
      
      if (response.data.status === 'success') {
        toast.success(`Internet ${action === 'on' ? 'ligada' : 'desligada'} com sucesso`)
      }
    } catch (error) {
      toast.error(`Erro ao ${action === 'on' ? 'ligar' : 'desligar'} internet`)
    } finally {
      setLoading(false)
    }
  }

  const onlineCount = machines.filter(m => m.status === 'online').length
  const offlineCount = machines.filter(m => m.status === 'offline').length

  return (
    <Box className="machines-page fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Gerenciamento de Máquinas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie e monitore todas as máquinas do laboratório
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Configurar faixa de IPs">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setIPRangeDialogOpen(true)}
            >
              Configurar
            </Button>
          </Tooltip>
          <Tooltip title="Atualizar status">
            <span>
              <IconButton
                onClick={refreshStatus}
                disabled={!connected}
                color="primary"
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
              border: `1px solid ${theme.palette.primary.main}30`,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {machines.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total de Máquinas
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.success.main}05 100%)`,
              border: `1px solid ${theme.palette.success.main}30`,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {onlineCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Online
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${theme.palette.error.main}15 0%, ${theme.palette.error.main}05 100%)`,
              border: `1px solid ${theme.palette.error.main}30`,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {offlineCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Offline
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Controles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Buscar por IP ou hostname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filtro</InputLabel>
              <Select
                value={filter}
                label="Filtro"
                onChange={(e) => setFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PowerIcon />}
                onClick={handleTurnOn}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Ligar
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<PowerIcon />}
                onClick={handleTurnOff}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Desligar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Controles de Internet */}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<WifiIcon />}
            onClick={() => handleInternetControl('on')}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Ligar Internet
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<WifiOffIcon />}
            onClick={() => handleInternetControl('off')}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Desligar Internet
          </Button>
        </Box>

        {selectedMachines.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`${selectedMachines.length} máquina(s) selecionada(s)`}
              onDelete={() => setSelectedMachines([])}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}
      </Paper>

      {/* Grid de Máquinas */}
      {filteredMachines.length > 0 ? (
        <Grid container spacing={2}>
          {filteredMachines.map((machine) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={machine.ip}>
              <MachineCard
                machine={machine}
                selected={selectedMachines.includes(machine.ip)}
                onSelect={() => toggleMachineSelection(machine.ip)}
                onTurnOff={() => handleTurnOffOne(machine.ip)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {machines.length === 0
              ? 'Nenhuma máquina configurada'
              : 'Nenhuma máquina encontrada'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {machines.length === 0
              ? 'Configure a faixa de IPs primeiro para começar.'
              : 'Tente ajustar os filtros de busca.'}
          </Typography>
        </Paper>
      )}

      <IPRangeDialog
        open={ipRangeDialogOpen}
        onClose={() => setIPRangeDialogOpen(false)}
        onSuccess={() => {
          setIPRangeDialogOpen(false)
          refreshStatus()
        }}
      />
    </Box>
  )
}

export default Machines
