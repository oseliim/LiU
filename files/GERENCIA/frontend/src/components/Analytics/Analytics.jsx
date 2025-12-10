import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  CircularProgress
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Terminal as TerminalIcon,
  Router as RouterIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import api from '../../services/api'
import './Analytics.css'

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState(24)
  const [loading, setLoading] = useState(true)
  const [usageStats, setUsageStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [machineStats, setMachineStats] = useState(null)
  const [performanceSummary, setPerformanceSummary] = useState(null)
  const [processes, setProcesses] = useState([])
  const [networkPorts, setNetworkPorts] = useState([])
  const [processSort, setProcessSort] = useState('cpu')
  const [portSort, setPortSort] = useState('port')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    loadAnalyticsData()
    const interval = setInterval(loadAnalyticsData, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [timeRange])

  useEffect(() => {
    if (activeTab === 4) {
      // Carregar imediatamente quando a aba for aberta
      loadProcessesAndPorts()
      // Atualizar a cada 5 segundos
      const interval = setInterval(loadProcessesAndPorts, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, processSort, portSort])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Carregar todas as estatísticas em paralelo
      const [statsRes, trendsRes, machinesRes, perfRes] = await Promise.all([
        api.get('/analytics/usage-stats'),
        api.get(`/analytics/trends?hours=${timeRange}`),
        api.get('/analytics/machine-stats'),
        api.get('/analytics/performance-summary')
      ])

      if (statsRes.data.status === 'success') {
        setUsageStats(statsRes.data.data)
      }
      if (trendsRes.data.status === 'success') {
        setTrends(trendsRes.data.data.trends || [])
      }
      if (machinesRes.data.status === 'success') {
        setMachineStats(machinesRes.data.data)
      }
      if (perfRes.data.status === 'success') {
        setPerformanceSummary(perfRes.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProcessesAndPorts = async () => {
    setIsRefreshing(true)
    try {
      const [processesRes, portsRes] = await Promise.all([
        api.get(`/analytics/processes?sort=${processSort}&limit=50`),
        api.get(`/analytics/network-ports?sort=${portSort}&limit=100`)
      ])

      // Atualizar apenas se houver sucesso, mantendo dados anteriores se houver erro
      if (processesRes.data.status === 'success') {
        const newProcesses = processesRes.data.data.processes || []
        if (newProcesses.length > 0) {
          setProcesses(newProcesses)
        }
      }
      if (portsRes.data.status === 'success') {
        const newPorts = portsRes.data.data.connections || []
        if (newPorts.length > 0) {
          setNetworkPorts(newPorts)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar processos e portas:', error)
      // Não limpar os dados em caso de erro, manter os anteriores
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportReport = async () => {
    try {
      const response = await api.get('/analytics/reports?type=summary&format=csv', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-ltsp-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return theme.palette.success.main
      case 'good':
        return theme.palette.info.main
      case 'warning':
        return theme.palette.warning.main
      case 'critical':
        return theme.palette.error.main
      default:
        return theme.palette.grey[500]
    }
  }

  const COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main]

  if (loading && !usageStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="analytics-page fade-in">
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
            Analytics e Relatórios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análise detalhada de performance e estatísticas do sistema
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              label="Período"
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <MenuItem value={1}>Última hora</MenuItem>
              <MenuItem value={6}>Últimas 6 horas</MenuItem>
              <MenuItem value={24}>Últimas 24 horas</MenuItem>
              <MenuItem value={48}>Últimas 48 horas</MenuItem>
              <MenuItem value={168}>Última semana</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AssessmentIcon />} label="Visão Geral" />
          <Tab icon={<TrendingUpIcon />} label="Tendências" />
          <Tab icon={<ComputerIcon />} label="Máquinas" />
          <Tab icon={<MemoryIcon />} label="Performance" />
          <Tab icon={<TerminalIcon />} label="Processos e Portas" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Estatísticas Atuais */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  CPU
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {usageStats?.current?.cpu_usage?.toFixed(1) || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Média 24h: {usageStats?.averages_24h?.cpu || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Memória
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {usageStats?.current?.memory_usage?.toFixed(1) || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Média 24h: {usageStats?.averages_24h?.memory || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Máquinas Online
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {usageStats?.current?.machines_online || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total: {usageStats?.current?.machines_total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Uptime
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {usageStats?.current?.uptime_percentage?.toFixed(1) || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {usageStats?.current?.machines_offline || 0} offline
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Distribuição de Máquinas */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribuição de Máquinas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Online', value: usageStats?.current?.machines_online || 0 },
                      { name: 'Offline', value: usageStats?.current?.machines_offline || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={theme.palette.success.main} />
                    <Cell fill={theme.palette.error.main} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Resumo de Performance */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Status de Performance
              </Typography>
              {performanceSummary && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">CPU</Typography>
                    <Chip
                      label={performanceSummary.cpu.status}
                      color={performanceSummary.cpu.status === 'excellent' ? 'success' : performanceSummary.cpu.status === 'warning' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Memória</Typography>
                    <Chip
                      label={performanceSummary.memory.status}
                      color={performanceSummary.memory.status === 'excellent' ? 'success' : performanceSummary.memory.status === 'warning' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Disco</Typography>
                    <Chip
                      label={performanceSummary.disk.status}
                      color={performanceSummary.disk.status === 'excellent' ? 'success' : performanceSummary.disk.status === 'warning' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status Geral
                    </Typography>
                    <Chip
                      label={performanceSummary.overall_status}
                      color={performanceSummary.overall_status === 'excellent' ? 'success' : performanceSummary.overall_status === 'warning' ? 'warning' : 'info'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Tendências de Uso de Recursos
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="time" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke={theme.palette.primary.main}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    name="CPU (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke={theme.palette.info.main}
                    fillOpacity={1}
                    fill="url(#colorMemory)"
                    name="Memória (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Máquinas Online ao Longo do Tempo
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="time" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="machines_online"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    name="Máquinas Online"
                  />
                  <Line
                    type="monotone"
                    dataKey="machines_offline"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    name="Máquinas Offline"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && machineStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Estatísticas de Máquinas
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {machineStats.total}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Online</Typography>
                    <Chip label={machineStats.online} color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Offline</Typography>
                    <Chip label={machineStats.offline} color="error" size="small" />
                  </Box>
                  {machineStats.unknown > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Desconhecido</Typography>
                      <Chip label={machineStats.unknown} color="warning" size="small" />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribuição por Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Online', value: machineStats.online },
                  { name: 'Offline', value: machineStats.offline },
                  { name: 'Desconhecido', value: machineStats.unknown || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && performanceSummary && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MemoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    CPU
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {performanceSummary.cpu.usage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {performanceSummary.cpu.cores} núcleos físicos
                </Typography>
                <Chip
                  label={performanceSummary.cpu.status}
                  color={performanceSummary.cpu.status === 'excellent' ? 'success' : performanceSummary.cpu.status === 'warning' ? 'warning' : 'error'}
                  size="small"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Memória
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {performanceSummary.memory.usage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: {performanceSummary.memory.total}
                </Typography>
                <Chip
                  label={performanceSummary.memory.status}
                  color={performanceSummary.memory.status === 'excellent' ? 'success' : performanceSummary.memory.status === 'warning' ? 'warning' : 'error'}
                  size="small"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NetworkIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Disco
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {performanceSummary.disk.usage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {performanceSummary.disk.partitions} partição(ões)
                </Typography>
                <Chip
                  label={performanceSummary.disk.status}
                  color={performanceSummary.disk.status === 'excellent' ? 'success' : performanceSummary.disk.status === 'warning' ? 'warning' : 'error'}
                  size="small"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Processos */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TerminalIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Processos em Execução
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={processSort}
                    label="Ordenar por"
                    onChange={(e) => setProcessSort(e.target.value)}
                  >
                    <MenuItem value="cpu">CPU</MenuItem>
                    <MenuItem value="memory">Memória</MenuItem>
                    <MenuItem value="name">Nome</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ position: 'relative' }}>
                {isRefreshing && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxHeight: 600,
                    overflow: 'auto',
                    opacity: isRefreshing ? 0.7 : 1,
                    transition: 'opacity 0.2s ease',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.primary.main,
                      borderRadius: '4px',
                    },
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {/* Cabeçalho da tabela */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 80px 80px 100px 100px',
                        gap: 1,
                        p: 1.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                        fontWeight: 600,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>PID</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Nome</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>CPU %</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>MEM %</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>RAM (MB)</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Status</Typography>
                    </Box>
                    {processes.length === 0 ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        {isRefreshing ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography color="text.secondary">Nenhum processo encontrado</Typography>
                        )}
                      </Box>
                    ) : (
                      processes.map((proc) => (
                        <Box
                          key={`proc-${proc.pid}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 80px 80px 100px 100px',
                            gap: 1,
                            p: 1.5,
                            borderBottom: 1,
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {proc.pid}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={proc.name}
                          >
                            {proc.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              color: proc.cpu_percent > 50 ? theme.palette.error.main : proc.cpu_percent > 20 ? theme.palette.warning.main : 'inherit',
                              fontWeight: proc.cpu_percent > 50 ? 700 : 400,
                            }}
                          >
                            {proc.cpu_percent.toFixed(1)}%
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              color: proc.memory_percent > 5 ? theme.palette.error.main : proc.memory_percent > 2 ? theme.palette.warning.main : 'inherit',
                              fontWeight: proc.memory_percent > 5 ? 700 : 400,
                            }}
                          >
                            {proc.memory_percent.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {proc.memory_mb.toFixed(1)}
                          </Typography>
                          <Chip
                            label={proc.status}
                            size="small"
                            color={proc.status === 'running' ? 'success' : proc.status === 'sleeping' ? 'info' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      ))
                    )}
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Portas de Rede */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouterIcon sx={{ color: theme.palette.info.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Portas de Rede
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={portSort}
                    label="Ordenar por"
                    onChange={(e) => setPortSort(e.target.value)}
                  >
                    <MenuItem value="port">Porta</MenuItem>
                    <MenuItem value="pid">PID</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ position: 'relative' }}>
                {isRefreshing && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxHeight: 600,
                    overflow: 'auto',
                    opacity: isRefreshing ? 0.7 : 1,
                    transition: 'opacity 0.2s ease',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.info.main,
                      borderRadius: '4px',
                    },
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {/* Cabeçalho da tabela */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '100px 120px 120px 100px 1fr',
                        gap: 1,
                        p: 1.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                        fontWeight: 600,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Porta Local</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Porta Remota</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Status</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>PID</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Processo</Typography>
                    </Box>
                    {networkPorts.length === 0 ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        {isRefreshing ? (
                          <CircularProgress size={24} />
                        ) : (
                          <>
                            <Typography color="text.secondary">Nenhuma porta encontrada</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Pode ser necessário executar como administrador
                            </Typography>
                          </>
                        )}
                      </Box>
                     ) : (
                       networkPorts.map((port, index) => {
                         const uniqueKey = `port-${port.laddr}-${port.pid || 'unknown'}-${index}`
                         return (
                           <Box
                             key={uniqueKey}
                             sx={{
                               display: 'grid',
                               gridTemplateColumns: '100px 120px 120px 100px 1fr',
                               gap: 1,
                               p: 1.5,
                               borderBottom: 1,
                               borderColor: 'divider',
                               '&:hover': {
                                 bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                               },
                             }}
                           >
                             <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                               {port.laddr}
                             </Typography>
                             <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                               {port.raddr}
                             </Typography>
                             <Chip
                               label={port.status}
                               size="small"
                               color={
                                 port.status === 'ESTABLISHED' ? 'success' :
                                 port.status === 'LISTEN' ? 'info' :
                                 port.status === 'TIME_WAIT' ? 'warning' : 'default'
                               }
                               sx={{ fontSize: '0.7rem', height: 20 }}
                             />
                             <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                               {port.pid !== 'N/A' ? port.pid : '-'}
                             </Typography>
                             <Typography
                               variant="body2"
                               sx={{
                                 fontFamily: 'monospace',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap',
                               }}
                               title={port.process_name}
                             >
                               {port.process_name}
                             </Typography>
                           </Box>
                         )
                       })
                     )}
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default Analytics
