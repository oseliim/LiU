import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material'
import {
  Send as SendIcon,
  Terminal as TerminalIcon,
  History as HistoryIcon,
  Computer as ComputerIcon,
  PowerSettingsNew as PowerIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../../services/api'
import './Commands.css'

const Commands = () => {
  const [command, setCommand] = useState('')
  const [selectedIP, setSelectedIP] = useState('')
  const [output, setOutput] = useState([])
  const [allowedCommands, setAllowedCommands] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeMachines, setActiveMachines] = useState([])
  const [loadingMachines, setLoadingMachines] = useState(false)
  const [turningOn, setTurningOn] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    const fetchAllowedCommands = async () => {
      try {
        const response = await api.get('/commands/allowed')
        if (response.data.status === 'success') {
          setAllowedCommands(response.data.data.commands || [])
        }
      } catch (error) {
        console.error('Erro ao buscar comandos permitidos:', error)
      }
    }
    fetchAllowedCommands()
    fetchActiveMachines()
  }, [])

  const fetchActiveMachines = async () => {
    setLoadingMachines(true)
    try {
      const response = await api.get('/machines/active')
      if (response.data.status === 'success') {
        setActiveMachines(response.data.data.machines || [])
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas ativas:', error)
      toast.error('Erro ao buscar máquinas ativas')
    } finally {
      setLoadingMachines(false)
    }
  }

  const handleTurnOnMachines = async (lab = null) => {
    setTurningOn(true)
    try {
      const response = await api.post('/machines/turn-on', { lab })
      if (response.data.status === 'success') {
        toast.success(lab ? `Máquinas do laboratório ${lab} ligadas com sucesso` : 'Todas as máquinas ligadas com sucesso')
        // Atualiza a lista após um delay
        setTimeout(() => {
          fetchActiveMachines()
        }, 3000)
      } else {
        toast.error(response.data.error || 'Erro ao ligar máquinas')
      }
    } catch (error) {
      toast.error('Erro ao ligar máquinas')
      console.error(error)
    } finally {
      setTurningOn(false)
    }
  }

  const handleExecute = async () => {
    if (!command.trim()) {
      toast.error('Digite um comando')
      return
    }

    setLoading(true)
    setOutput([])

    try {
      const endpoint = selectedIP
        ? `/commands/execute-one`
        : `/commands/execute`

      const body = selectedIP
        ? { command, ip: selectedIP }
        : { command }

      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        lines.forEach(line => {
          const data = line.replace('data: ', '')
          if (data.trim()) {
            setOutput(prev => [...prev, data])
          }
        })
      }

      toast.success('Comando executado')
    } catch (error) {
      toast.error('Erro ao executar comando')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="commands-page fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
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
          Execução de Comandos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Execute comandos remotos nas máquinas do laboratório
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Seção de Máquinas Ativas */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ComputerIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Máquinas Ativas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estações LTSP conectadas no momento
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Atualizar lista">
                  <IconButton onClick={fetchActiveMachines} disabled={loadingMachines}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<PowerIcon />}
                  onClick={() => handleTurnOnMachines()}
                  disabled={turningOn}
                  color="success"
                >
                  {turningOn ? 'Ligando...' : 'Ligar Todas'}
                </Button>
              </Box>
            </Box>

            {loadingMachines ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : activeMachines.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhuma máquina ativa no momento
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {activeMachines.map((machine, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff'} 0%, ${theme.palette.mode === 'dark' ? '#1f1f1f' : '#f5f5f5'} 100%)`,
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 8px 16px rgba(0, 0, 0, 0.3)' 
                            : '0 8px 16px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 48,
                              height: 48,
                              mr: 2,
                            }}
                          >
                            <ComputerIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {machine.user || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {machine.lab || 'Sem laboratório'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>IP:</strong> {machine.ip}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>MAC:</strong> {machine.mac}
                          </Typography>
                        </Box>
                        <Chip
                          label="Online"
                          color="success"
                          size="small"
                          sx={{ width: '100%' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TerminalIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Terminal Remoto
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="IP da Máquina (opcional - deixe vazio para todas)"
              value={selectedIP}
              onChange={(e) => setSelectedIP(e.target.value)}
              placeholder="Ex: 10.100.64.100"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Comando"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite o comando..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleExecute()
                }
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Comandos Permitidos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allowedCommands.map((cmd) => (
                  <Chip
                    key={cmd}
                    label={cmd}
                    size="small"
                    onClick={() => setCommand(cmd)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleExecute}
              disabled={loading || !command.trim()}
              fullWidth
              sx={{ py: 1.5 }}
            >
              {loading ? 'Executando...' : 'Executar Comando'}
            </Button>
          </Paper>

          {output.length > 0 && (
            <Paper
              sx={{
                p: 3,
                mt: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Saída do Comando
                  </Typography>
                </Box>
                <Button size="small" onClick={() => setOutput([])}>
                  Limpar
                </Button>
              </Box>
              <Box
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#1e1e1e',
                  color: '#d4d4d4',
                  p: 2,
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  maxHeight: 400,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {output.map((line, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    {line}
                  </div>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Informações
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Execute comandos em todas as máquinas do laboratório ou em uma máquina específica.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Apenas comandos da lista de permitidos podem ser executados por segurança.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Para executar em uma máquina específica, informe o IP no campo acima.
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Ligar Máquinas
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Use o botão "Ligar Todas" para acionar todas as máquinas via Wake-on-LAN.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PowerIcon />}
                  onClick={() => handleTurnOnMachines()}
                  disabled={turningOn}
                  fullWidth
                  color="success"
                  sx={{ mt: 1 }}
                >
                  {turningOn ? 'Ligando...' : 'Ligar Todas as Máquinas'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Commands
