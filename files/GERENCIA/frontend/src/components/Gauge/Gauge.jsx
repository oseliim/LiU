import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'

const Gauge = ({ 
  title, 
  value, 
  min = 0, 
  max = 100, 
  unit = '%',
  thresholds = { warning: 70, critical: 85 },
  size = 200,
  showValue = true
}) => {
  const theme = useTheme()
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100)
  
  // Determinar cor baseada no valor
  const getColor = () => {
    if (percentage >= thresholds.critical) {
      return theme.palette.error.main
    } else if (percentage >= thresholds.warning) {
      return theme.palette.warning.main
    } else {
      return theme.palette.success.main
    }
  }

  const color = getColor()
  const svgSize = size
  const radius = svgSize * 0.25
  const centerX = svgSize / 2
  const centerY = svgSize * 0.6
  const strokeWidth = svgSize * 0.05
  
  // Ângulos do semicírculo (180 graus: de 180° à esquerda até 0° à direita)
  const startAngle = 180
  const endAngle = 0
  
  // Converter para radianos
  const startAngleRad = (startAngle * Math.PI) / 180
  const endAngleRad = (endAngle * Math.PI) / 180
  
  // Calcular ângulo atual (de 180° para 0° conforme aumenta)
  const angleRange = Math.abs(endAngleRad - startAngleRad)
  const currentAngleRad = startAngleRad - (angleRange * (percentage / 100))
  
  // Função auxiliar para calcular coordenadas
  const getCoordinates = (angle, r) => ({
    x: centerX + r * Math.cos(angle),
    y: centerY + r * Math.sin(angle)
  })
  
  // Calcular pontos do arco
  const startPoint = getCoordinates(startAngleRad, radius)
  const endPoint = getCoordinates(endAngleRad, radius)
  const currentPoint = getCoordinates(currentAngleRad, radius)
  
  // Path do arco completo (fundo)
  const fullArcPath = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 1 0 ${endPoint.x} ${endPoint.y}`
  
  // Path do arco de valor
  const valueArcPath = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 0 ${currentPoint.x} ${currentPoint.y}`
  
  // Calcular posição do ponteiro
  const pointerLength = radius * 0.85
  const pointerEnd = getCoordinates(currentAngleRad, pointerLength)
  
  // Criar ID único para o gradiente (usando título + valor aleatório)
  const gradientId = `gauge-grad-${title.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substr(2, 9)}`
  
  // Marcadores de escala (0, 20, 40, 60, 80, 100)
  const scaleMarkers = [0, 20, 40, 60, 80, 100].map(markerValue => {
    const markerAngle = startAngleRad - (angleRange * (markerValue / 100))
    const markerInner = getCoordinates(markerAngle, radius - strokeWidth * 0.3)
    const markerOuter = getCoordinates(markerAngle, radius + strokeWidth * 0.5)
    const labelPos = getCoordinates(markerAngle, radius + strokeWidth * 1.5)
    
    return {
      inner: markerInner,
      outer: markerOuter,
      label: labelPos,
      value: markerValue
    }
  })

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        width: svgSize,
        height: svgSize * 0.7,
      }}
    >
      {/* Título */}
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 500,
          color: 'text.secondary',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}
      >
        {title}
      </Typography>

      {/* SVG Gauge */}
      <Box sx={{ position: 'relative', width: svgSize, height: svgSize * 0.6 }}>
        <svg 
          width={svgSize} 
          height={svgSize * 0.6} 
          viewBox={`0 0 ${svgSize} ${svgSize * 0.6}`}
          style={{ display: 'block' }}
        >
          {/* Definições de gradiente */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.palette.success.main} />
              <stop offset={`${thresholds.warning}%`} stopColor={theme.palette.success.main} />
              <stop offset={`${thresholds.warning}%`} stopColor={theme.palette.warning.main} />
              <stop offset={`${thresholds.critical}%`} stopColor={theme.palette.warning.main} />
              <stop offset={`${thresholds.critical}%`} stopColor={theme.palette.error.main} />
              <stop offset="100%" stopColor={theme.palette.error.main} />
            </linearGradient>
          </defs>

          {/* Arco de fundo (cinza claro) */}
          <path
            d={fullArcPath}
            fill="none"
            stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Arco de valor (colorido) */}
          {percentage > 0 && (
            <path
              d={valueArcPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                transition: 'all 0.5s ease',
              }}
            />
          )}

          {/* Marcadores de escala */}
          {scaleMarkers.map((marker, index) => (
            <g key={index}>
              <line
                x1={marker.inner.x}
                y1={marker.inner.y}
                x2={marker.outer.x}
                y2={marker.outer.y}
                stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                strokeWidth={2}
              />
              <text
                x={marker.label.x}
                y={marker.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.palette.text.secondary}
                fontSize={svgSize * 0.07}
                fontWeight={500}
              >
                {marker.value}
              </text>
            </g>
          ))}

          {/* Ponteiro */}
          <line
            x1={centerX}
            y1={centerY}
            x2={pointerEnd.x}
            y2={pointerEnd.y}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            style={{
              transition: 'all 0.5s ease',
            }}
          />
          
          {/* Centro do ponteiro */}
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill={color}
          />
        </svg>

        {/* Valor no centro */}
        {showValue && (
          <Box
            sx={{
              position: 'absolute',
              bottom: svgSize * 0.12,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: color,
                lineHeight: 1,
                fontSize: svgSize * 0.16,
              }}
            >
              {value.toFixed(1)}
              {unit}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Gauge
