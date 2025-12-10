import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useThemeStore } from './store/themeStore'
import { lightTheme, darkTheme } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Machines from './components/Machines/Machines'
import Monitoring from './components/Monitoring/Monitoring'
import Commands from './components/Commands/Commands'
import Scheduling from './components/Scheduling/Scheduling'
import Analytics from './components/Analytics/Analytics'
import './App.css'

function App() {
  const { darkMode } = useThemeStore()
  const theme = darkMode ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/machines" element={<Machines />} />
                      <Route path="/monitoring" element={<Monitoring />} />
                      <Route path="/commands" element={<Commands />} />
                      <Route path="/scheduling" element={<Scheduling />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </ThemeProvider>
  )
}

export default App
