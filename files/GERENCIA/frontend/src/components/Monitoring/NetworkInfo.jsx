import React from 'react'
import { Box, Typography, Grid, Paper, Card, CardContent, useTheme } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, NetworkCheck as NetworkIcon } from '@mui/icons-material'

const NetworkInfo = ({ data, loading }) => {
  const theme = useTheme()
  const [uploadHistory, setUploadHistory] = React.useState([])
  const [downloadHistory, setDownloadHistory] = React.useState([])

  React.useEffect(() => {
    if (data) {
      const parseBytes = (str) => {
        if (!str) return 0
        const match = str.match(/(\d+\.?\d*)\s*(\w+)/)
        if (!match) return 0
        const value = parseFloat(match[1])
        const unit = match[2].toUpperCase()
        const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3 }
        return value * (multipliers[unit] || 1)
      }

      const uploadValue = parseBytes(data.upload)
      const downloadValue = parseBytes(data.download)

      setUploadHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          value: uploadValue
        }]
        return newHistory.slice(-30)
      })

      setDownloadHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          value: downloadValue
        }]
        return newHistory.slice(-30)
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NetworkIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Monitoramento de Rede
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tráfego de upload e download em tempo real
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Upload
              </Typography>
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
              {data.upload || 'N/A'}
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={uploadHistory}>
                <defs>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="time" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUpload)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingDownIcon color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Download
              </Typography>
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'success.main', mb: 3 }}>
              {data.download || 'N/A'}
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={downloadHistory}>
                <defs>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="time" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDownload)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Estatísticas de Rede
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bytes Enviados
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {data.bytes_sent ? `${(data.bytes_sent / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bytes Recebidos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {data.bytes_recv ? `${(data.bytes_recv / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pacotes Enviados
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {data.packets_sent || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pacotes Recebidos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {data.packets_recv || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default NetworkInfo
