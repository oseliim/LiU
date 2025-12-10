import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  useTheme
} from '@mui/material'
import { useServerMetrics } from '../../hooks/useServerMetrics'
import CPUInfo from './CPUInfo'
import MemoryInfo from './MemoryInfo'
import DiskInfo from './DiskInfo'
import NetworkInfo from './NetworkInfo'
import './Monitoring.css'

const Monitoring = () => {
  const { metrics, loading } = useServerMetrics(2000)
  const [tab, setTab] = useState(0)
  const theme = useTheme()

  const tabs = [
    { label: 'CPU', value: 0 },
    { label: 'Memória', value: 1 },
    { label: 'Disco', value: 2 },
    { label: 'Rede', value: 3 },
  ]

  return (
    <Box className="monitoring-page fade-in">
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
          Monitoramento do Servidor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acompanhe em tempo real o desempenho e recursos do servidor
        </Typography>
      </Box>

      <Paper
        sx={{
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 64,
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {tabs.map((tabItem) => (
            <Tab key={tabItem.value} label={tabItem.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 4 }}>
          {tab === 0 && <CPUInfo data={metrics.cpu} loading={loading} />}
          {tab === 1 && <MemoryInfo data={metrics.memory} loading={loading} />}
          {tab === 2 && <DiskInfo data={metrics.disk} loading={loading} />}
          {tab === 3 && <NetworkInfo data={metrics.network} loading={loading} />}
        </Box>
      </Paper>
    </Box>
  )
}

export default Monitoring
