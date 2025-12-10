import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  useTheme
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../../services/api'
import './Scheduling.css'

const Scheduling = () => {
  const [schedules, setSchedules] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    action: 'turn_off',
    frequency: 'daily',
    time: '',
    dayOfWeek: '',
    dayOfMonth: ''
  })
  const theme = useTheme()

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      const response = await api.get('/scheduling/list')
      if (response.data.status === 'success') {
        setSchedules(response.data.data.schedules || [])
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    }
  }

  const generateCronExpression = () => {
    const { frequency, time, dayOfWeek, dayOfMonth } = formData
    const [hour, minute] = time.split(':').map(Number)

    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  const handleSubmit = async () => {
    if (!formData.time) {
      toast.error('Informe o horário')
      return
    }

    if (formData.frequency === 'weekly' && !formData.dayOfWeek) {
      toast.error('Selecione o dia da semana')
      return
    }

    if (formData.frequency === 'monthly' && !formData.dayOfMonth) {
      toast.error('Informe o dia do mês')
      return
    }

    setLoading(true)
    try {
      const cronExpression = generateCronExpression()
      const response = await api.post('/scheduling/schedule', {
        action: formData.action,
        cron_expression: cronExpression
      })

      if (response.data.status === 'success') {
        toast.success('Agendamento criado com sucesso')
        setDialogOpen(false)
        setFormData({
          action: 'turn_off',
          frequency: 'daily',
          time: '',
          dayOfWeek: '',
          dayOfMonth: ''
        })
        loadSchedules()
      }
    } catch (error) {
      toast.error('Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (command) => {
    if (!window.confirm('Deseja realmente remover este agendamento?')) {
      return
    }

    try {
      const response = await api.post('/scheduling/remove', { command })
      if (response.data.status === 'success') {
        toast.success('Agendamento removido')
        loadSchedules()
      }
    } catch (error) {
      toast.error('Erro ao remover agendamento')
    }
  }

  const formatCronExpression = (cron) => {
    const parts = cron.split(' ')
    if (parts.length !== 5) return cron

    const [minute, hour, day, month, weekday] = parts
    let description = `Todo dia às ${hour}:${minute.padStart(2, '0')}`

    if (weekday !== '*') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      description = `${days[parseInt(weekday)]} às ${hour}:${minute.padStart(2, '0')}`
    }

    if (day !== '*') {
      description = `Dia ${day} de cada mês às ${hour}:${minute.padStart(2, '0')}`
    }

    return description
  }

  return (
    <Box className="scheduling-page fade-in">
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
            Agendamento de Ações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure ações automáticas para o laboratório
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Novo Agendamento
        </Button>
      </Box>

      <Paper
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.mode === 'dark' ? '#252525' : '#fafafa'} 100%)`,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Expressão Cron</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box sx={{ py: 6 }}>
                      <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Nenhum agendamento configurado
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Novo Agendamento" para criar um
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={schedule.command.includes('turn_on') ? 'Ligar' : 'Desligar'}
                        color={schedule.command.includes('turn_on') ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.85rem' }}>
                        {schedule.cron_expression}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatCronExpression(schedule.cron_expression)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(schedule.command)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Novo Agendamento</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Ação</InputLabel>
            <Select
              value={formData.action}
              label="Ação"
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            >
              <MenuItem value="turn_on">Ligar Laboratório</MenuItem>
              <MenuItem value="turn_off">Desligar Laboratório</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Frequência</InputLabel>
            <Select
              value={formData.frequency}
              label="Frequência"
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <MenuItem value="daily">Diária</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="monthly">Mensal</MenuItem>
            </Select>
          </FormControl>

          {formData.frequency === 'weekly' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Dia da Semana</InputLabel>
              <Select
                value={formData.dayOfWeek}
                label="Dia da Semana"
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              >
                <MenuItem value="0">Domingo</MenuItem>
                <MenuItem value="1">Segunda-feira</MenuItem>
                <MenuItem value="2">Terça-feira</MenuItem>
                <MenuItem value="3">Quarta-feira</MenuItem>
                <MenuItem value="4">Quinta-feira</MenuItem>
                <MenuItem value="5">Sexta-feira</MenuItem>
                <MenuItem value="6">Sábado</MenuItem>
              </Select>
            </FormControl>
          )}

          {formData.frequency === 'monthly' && (
            <TextField
              fullWidth
              type="number"
              label="Dia do Mês"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
              inputProps={{ min: 1, max: 31 }}
              sx={{ mt: 2 }}
            />
          )}

          <TextField
            fullWidth
            type="time"
            label="Horário"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Agendar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Scheduling
