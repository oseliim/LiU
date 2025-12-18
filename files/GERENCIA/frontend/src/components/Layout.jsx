import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Avatar,
  Divider,
  Badge,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Computer as ComputerIcon,
  Monitor as MonitorIcon,
  Terminal as TerminalIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useThemeStore } from '../store/themeStore'
import { useAuth } from '../contexts/AuthContext'
import ServerSelector from './Servers/ServerSelector'
import { toast } from 'react-toastify'
import './Layout.css'

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Máquinas', icon: <ComputerIcon />, path: '/machines' },
  { text: 'Monitoramento', icon: <MonitorIcon />, path: '/monitoring' },
  { text: 'Comandos', icon: <TerminalIcon />, path: '/commands' },
  { text: 'Agendamento', icon: <ScheduleIcon />, path: '/scheduling' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' }
]

const DRAWER_WIDTH = 280

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { darkMode, toggleDarkMode } = useThemeStore()
  const { user, logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    handleMenuClose()
  }

  const getUserInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Header do Sidebar */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}
        >
          LTSP
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            LTSP Manager
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            v2.0.0
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flex: 1, pt: 2, px: 1.5 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path
          const isCommands = item.path === '/commands'
          
          const handleItemClick = (e) => {
            if (isMobile) {
              setMobileOpen(false)
            }
            
            // Intercepta clique em Commands para mostrar mensagem
            if (isCommands) {
              e.preventDefault()
              toast.info('Página sendo concertada', {
                position: 'top-right',
                autoClose: 3000,
              })
            }
          }
          
          return (
            <ListItem
              key={item.text}
              component={isCommands ? 'div' : Link}
              to={isCommands ? undefined : item.path}
              onClick={handleItemClick}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: isSelected
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(0, 146, 0, 0.15)'
                    : 'rgba(0, 128, 0, 0.1)'
                  : 'transparent',
                cursor: isCommands ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: isSelected
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(0, 146, 0, 0.2)'
                      : 'rgba(0, 128, 0, 0.15)'
                    : theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  color: isSelected ? theme.palette.primary.main : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.9rem',
                }}
              />
            </ListItem>
          )
        })}
      </List>

      <Divider />

      {/* Dark Mode Toggle */}
      <Box sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              icon={<Brightness7 sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
              checkedIcon={<Brightness4 />}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {darkMode ? 'Modo Escuro' : 'Modo Claro'}
            </Typography>
          }
          sx={{ m: 0 }}
        />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: '1rem', md: '1.25rem' },
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Sistema de Gerenciamento Laboratorial LTSP
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Seletor de Servidor */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <ServerSelector />
            </Box>

            <IconButton color="inherit" size="small">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit" size="small">
              <SettingsIcon />
            </IconButton>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                ml: 1,
                cursor: 'pointer'
              }}
              onClick={handleMenuOpen}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.username || 'Usuário'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || ''}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Menu do Usuário */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {/* Seletor de Servidor Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2, pb: 0 }}>
          <ServerSelector />
        </Box>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  )
}

export default Layout
