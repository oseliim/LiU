import React from 'react'
import { Box, Typography, Grid, Paper, Card, CardContent, LinearProgress, useTheme } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Speed as SpeedIcon } from '@mui/icons-material'

const CPUInfo = ({ data, loading }) => {
  const theme = useTheme()
  const [history, setHistory] = React.useState([])

  React.useEffect(() => {
    if (data && data.overall_usage !== undefined) {
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          usage: data.overall_usage
        }]
        return newHistory.slice(-30) // Manter últimos 30 pontos
      })
    }
  }, [data])

  if (loading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Carregando...</Typography>
      </Box>
    )
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Nenhum dado disponível</Typography>
      </Box>
    )
  }

  const usage = data.overall_usage || 0
  const usageColor = usage > 80 ? theme.palette.error.main : usage > 60 ? theme.palette.warning.main : theme.palette.primary.main

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Gráfico Principal */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SpeedIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uso da CPU ao Longo do Tempo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Últimos 30 pontos de medição
                </Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={usageColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={usageColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.75rem' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usage"
                  stroke={usageColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Informações */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Informações do Processador
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Processador
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                {data.processor || 'N/A'}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Núcleos Físicos
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                {data.physical_cores}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Threads Totais
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                {data.total_threads}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Frequência
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {data.current_frequency || 'N/A'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Barra de Progresso */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uso Geral da CPU
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: usageColor,
                  }}
                >
                  {usage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={usage}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 8,
                    bgcolor: usageColor,
                    boxShadow: `0 0 10px ${usageColor}40`,
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CPUInfo
