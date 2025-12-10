import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox,
  Tooltip,
  useTheme
} from '@mui/material'
import {
  PowerSettingsNew as PowerIcon,
  Computer as ComputerIcon
} from '@mui/icons-material'

const MachineCard = ({ machine, selected, onSelect, onTurnOff }) => {
  const theme = useTheme()
  const isOnline = machine.status === 'online'

  return (
    <Card
      sx={{
        height: '100%',
        border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
          borderColor: theme.palette.primary.main,
        },
        bgcolor: isOnline
          ? theme.palette.mode === 'dark'
            ? 'rgba(40, 167, 69, 0.08)'
            : 'rgba(40, 167, 69, 0.04)'
          : 'background.paper',
      }}
      onClick={onSelect}
    >
      <CardContent sx={{ p: 2.5, position: 'relative' }}>
        {/* Checkbox no canto superior direito */}
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        />

        {/* Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: isOnline ? theme.palette.success.main : theme.palette.error.main,
            boxShadow: `0 0 8px ${isOnline ? theme.palette.success.main : theme.palette.error.main}`,
            animation: isOnline ? 'pulse 2s infinite' : 'none',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: isOnline
                ? `${theme.palette.success.main}15`
                : `${theme.palette.error.main}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOnline ? theme.palette.success.main : theme.palette.error.main,
            }}
          >
            <ComputerIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {machine.ip}
            </Typography>
            {machine.hostname && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {machine.hostname}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'default'}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          <Tooltip title="Desligar máquina">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  onTurnOff()
                }}
                disabled={!isOnline}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(220, 53, 69, 0.08)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(220, 53, 69, 0.2)' : 'rgba(220, 53, 69, 0.15)',
                  },
                }}
              >
                <PowerIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </CardContent>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </Card>
  )
}

export default MachineCard
