import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  useTheme
} from '@mui/material'
import {
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Memory as MemoryIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon
} from '@mui/icons-material'
import { useMachineStatus } from '../../hooks/useMachineStatus'
import { useServerMetrics } from '../../hooks/useServerMetrics'
import MetricCard from './MetricCard'
import './Dashboard.css'

const Dashboard = () => {
  const { machines } = useMachineStatus()
  const { metrics } = useServerMetrics(5000)
  const theme = useTheme()

  const onlineCount = machines.filter(m => m.status === 'online').length
  const offlineCount = machines.filter(m => m.status === 'offline').length
  const totalMachines = machines.length
  const onlinePercentage = totalMachines > 0 ? (onlineCount / totalMachines) * 100 : 0

  return (
    <Box className="dashboard-container fade-in">
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
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo ao seu painel de controle
        </Typography>
      </Box>

      {/* Cards de Métricas Principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total de Máquinas"
            value={totalMachines}
            icon={<ComputerIcon />}
            color={theme.palette.primary.main}
            subtitle={`${onlineCount} online`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Máquinas Online"
            value={onlineCount}
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
            subtitle={`${onlinePercentage.toFixed(1)}% disponível`}
            trend={onlineCount > 0 ? '+' : null}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Máquinas Offline"
            value={offlineCount}
            icon={<CancelIcon />}
            color={theme.palette.error.main}
            subtitle={`${totalMachines > 0 ? ((offlineCount / totalMachines) * 100).toFixed(1) : 0}% indisponível`}
          />
        </Grid>
      </Grid>

      {/* Métricas do Servidor */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <SpeedIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uso da CPU
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processador
                </Typography>
              </Box>
            </Box>
            {metrics.cpu ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {metrics.cpu.overall_usage?.toFixed(1) || 0}%
                    </Typography>
                    <Chip
                      label={metrics.cpu.processor?.split(' ')[0] || 'N/A'}
                      size="small"
                      sx={{ bgcolor: 'primary.light', color: 'white' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.cpu.overall_usage || 0}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        bgcolor:
                          (metrics.cpu.overall_usage || 0) > 80
                            ? theme.palette.error.main
                            : (metrics.cpu.overall_usage || 0) > 60
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Núcleos Físicos
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metrics.cpu.physical_cores}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Threads
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metrics.cpu.total_threads}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography color="text.secondary">Carregando...</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.info.main,
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <MemoryIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uso de Memória
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  RAM do Sistema
                </Typography>
              </Box>
            </Box>
            {metrics.memory ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {metrics.memory.percent?.toFixed(1) || 0}%
                    </Typography>
                    <Chip
                      label={metrics.memory.used || 'N/A'}
                      size="small"
                      sx={{ bgcolor: 'info.light', color: 'white' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.memory.percent || 0}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        bgcolor:
                          (metrics.memory.percent || 0) > 80
                            ? theme.palette.error.main
                            : (metrics.memory.percent || 0) > 60
                            ? theme.palette.warning.main
                            : theme.palette.info.main,
                      },
                    }}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metrics.memory.total || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Disponível
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metrics.memory.available || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography color="text.secondary">Carregando...</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Status das Máquinas */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Status das Máquinas
          </Typography>
          <Chip
            label={`${onlineCount} online`}
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        {machines.length > 0 ? (
          <Grid container spacing={2}>
            {machines.slice(0, 12).map((machine) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={machine.ip}>
                <Card
                  sx={{
                    textAlign: 'center',
                    bgcolor:
                      machine.status === 'online'
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(40, 167, 69, 0.15)'
                          : 'rgba(40, 167, 69, 0.08)'
                        : theme.palette.mode === 'dark'
                        ? 'rgba(220, 53, 69, 0.15)'
                        : 'rgba(220, 53, 69, 0.08)',
                    border: `1px solid ${
                      machine.status === 'online'
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor:
                          machine.status === 'online'
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                        mx: 'auto',
                        mb: 1,
                        boxShadow: `0 0 8px ${
                          machine.status === 'online'
                            ? theme.palette.success.main
                            : theme.palette.error.main
                        }`,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                      {machine.ip}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {machine.status === 'online' ? 'Online' : 'Offline'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Nenhuma máquina configurada. Configure a faixa de IPs primeiro.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default Dashboard
