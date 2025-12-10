import React from 'react'
import { Box, Typography, Grid, LinearProgress, Paper, useTheme } from '@mui/material'
import { Storage as StorageIcon } from '@mui/icons-material'

const DiskInfo = ({ data, loading }) => {
  const theme = useTheme()

  if (loading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Carregando...</Typography>
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Nenhum dado disponível</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StorageIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Partições de Disco
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.length} partição(ões) encontrada(s)
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {data.map((disk, index) => {
          const usage = disk.percent || 0
          const usageColor = usage > 80 ? theme.palette.error.main : usage > 60 ? theme.palette.warning.main : theme.palette.primary.main

          return (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {disk.error ? (
                  <Typography color="error">{disk.error}</Typography>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {disk.device || disk.mountpoint}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {disk.fstype} • {disk.mountpoint}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: usageColor,
                        }}
                      >
                        {usage.toFixed(1)}%
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={usage}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            bgcolor: usageColor,
                          },
                        }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {disk.total_size}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Usado
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {disk.used}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Livre
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {disk.free}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default DiskInfo
