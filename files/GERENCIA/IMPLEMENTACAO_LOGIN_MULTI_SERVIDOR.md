# Guia de Implementação: Sistema de Login e Multi-Servidores

## 📋 Visão Geral

Este documento descreve como implementar:
1. **Sistema de autenticação** sem custos de hospedagem de banco de dados
2. **Multi-servidores** por usuário
3. **Seleção de servidor ativo**
4. **Acesso web** para múltiplos dispositivos

---

## 🗄️ Opções de Banco de Dados Gratuitas

### **Opção 1: SQLite (Recomendada para Início)**
- ✅ **100% Gratuito** - Arquivo local, sem servidor
- ✅ **Zero Configuração** - Funciona imediatamente
- ✅ **Portátil** - Arquivo único `.db`
- ✅ **Adequado para pequeno/médio porte**
- ⚠️ **Limitação:** Um arquivo por instância (mas pode ter múltiplos arquivos)

### **Opção 2: Bancos de Dados Gratuitos na Nuvem**

#### **Supabase (PostgreSQL)**
- ✅ 500MB de armazenamento gratuito
- ✅ API REST automática
- ✅ Autenticação integrada
- ✅ Dashboard web
- 🔗 https://supabase.com

#### **PlanetScale (MySQL)**
- ✅ 5GB de armazenamento gratuito
- ✅ Branching de banco de dados
- ✅ Escalável
- 🔗 https://planetscale.com

#### **Railway (PostgreSQL/MySQL)**
- ✅ $5 de crédito gratuito/mês
- ✅ Deploy fácil
- ✅ PostgreSQL ou MySQL
- 🔗 https://railway.app

#### **MongoDB Atlas**
- ✅ 512MB de armazenamento gratuito
- ✅ NoSQL
- ✅ Clusters compartilhados
- 🔗 https://www.mongodb.com/cloud/atlas

**Recomendação:** Começar com **SQLite** e migrar para **Supabase** quando necessário.

---

## 🏗️ Arquitetura Proposta

### **Estrutura de Dados**

```
User (Usuário)
├── id
├── username
├── email
├── password_hash
├── created_at
└── servers[] (relacionamento)

Server (Servidor)
├── id
├── user_id (FK)
├── name
├── host (IP ou domínio)
├── port
├── api_key (opcional, para autenticação do servidor)
├── is_active
├── created_at
└── config (JSON com configurações específicas)
```

### **Fluxo de Autenticação**

1. **Login:**
   - Usuário faz login → Recebe JWT token
   - Token armazenado no localStorage/cookies
   - Token enviado em todas as requisições

2. **Seleção de Servidor:**
   - Usuário seleciona servidor ativo
   - Servidor ativo armazenado no contexto/estado
   - Todas as requisições incluem `server_id`

3. **Requisições Protegidas:**
   - Middleware verifica JWT token
   - Valida acesso ao servidor selecionado
   - Retorna dados do servidor específico

---

## 📦 Dependências Necessárias

Adicionar ao `requirements.txt`:

```txt
# Autenticação
flask-jwt-extended==4.6.0
werkzeug==3.0.1  # Já tem, mas inclui password hashing

# Banco de Dados
flask-sqlalchemy==3.1.1
flask-migrate==4.0.5  # Para migrações de banco

# Validação
email-validator==2.1.0
```

---

## 🔐 Implementação Backend

### **1. Configuração do Banco de Dados**

**`backend/config.py`** (novo arquivo):
```python
import os
from pathlib import Path

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = False  # Tokens não expiram (ou definir tempo)
    
    # SQLite (padrão)
    BASE_DIR = Path(__file__).parent.parent
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{BASE_DIR}/ltsp_manager.db'
    )
    
    # Para PostgreSQL (Supabase, Railway, etc.)
    # SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # True para debug SQL
```

### **2. Modelos de Dados**

**`backend/models/user.py`**:
```python
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com servidores
    servers = db.relationship('Server', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Gera hash da senha"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica senha"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Serializa para JSON"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'servers_count': len(self.servers)
        }
```

**`backend/models/server.py`**:
```python
from .user import db
from datetime import datetime
import json

class Server(db.Model):
    __tablename__ = 'servers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    host = db.Column(db.String(255), nullable=False)  # IP ou domínio
    port = db.Column(db.Integer, default=5000)
    api_key = db.Column(db.String(255), nullable=True)  # Para autenticação do servidor
    is_active = db.Column(db.Boolean, default=False)
    config = db.Column(db.Text)  # JSON com configurações
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_config(self):
        """Retorna config como dict"""
        if self.config:
            return json.loads(self.config)
        return {}
    
    def set_config(self, config_dict):
        """Salva config como JSON"""
        self.config = json.dumps(config_dict)
    
    def to_dict(self):
        """Serializa para JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'host': self.host,
            'port': self.port,
            'is_active': self.is_active,
            'config': self.get_config(),
            'created_at': self.created_at.isoformat()
        }
```

### **3. Rotas de Autenticação**

**`backend/routes/auth.py`** (atualizar):
```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import db, User
from models.server import Server
from utils.helpers import create_response
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra novo usuário"""
    try:
        data = request.get_json()
        
        # Validação
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify(create_response(
                error='Username, email e password são obrigatórios',
                status=400
            )), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify(create_response(
                error='Username já existe',
                status=400
            )), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify(create_response(
                error='Email já cadastrado',
                status=400
            )), 400
        
        # Criar usuário
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Criar token
        access_token = create_access_token(identity=user.id)
        
        return jsonify(create_response(data={
            'user': user.to_dict(),
            'token': access_token
        })), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login de usuário"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify(create_response(
                error='Username e password são obrigatórios',
                status=400
            )), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify(create_response(
                error='Credenciais inválidas',
                status=401
            )), 401
        
        # Criar token
        access_token = create_access_token(identity=user.id)
        
        return jsonify(create_response(data={
            'user': user.to_dict(),
            'token': access_token
        }))
        
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Retorna usuário atual"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify(create_response(
                error='Usuário não encontrado',
                status=404
            )), 404
        
        return jsonify(create_response(data=user.to_dict()))
        
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500
```

### **4. Rotas de Servidores**

**`backend/routes/servers.py`** (novo arquivo):
```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import db, User
from models.server import Server
from utils.helpers import create_response

servers_bp = Blueprint('servers', __name__)

@servers_bp.route('', methods=['GET'])
@jwt_required()
def list_servers():
    """Lista servidores do usuário"""
    try:
        user_id = get_jwt_identity()
        servers = Server.query.filter_by(user_id=user_id).all()
        
        return jsonify(create_response(data={
            'servers': [s.to_dict() for s in servers]
        }))
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('', methods=['POST'])
@jwt_required()
def create_server():
    """Cria novo servidor"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name') or not data.get('host'):
            return jsonify(create_response(
                error='Name e host são obrigatórios',
                status=400
            )), 400
        
        # Se for o primeiro servidor, marcar como ativo
        existing_servers = Server.query.filter_by(user_id=user_id).count()
        is_active = existing_servers == 0
        
        server = Server(
            user_id=user_id,
            name=data['name'],
            host=data['host'],
            port=data.get('port', 5000),
            api_key=data.get('api_key'),
            is_active=is_active,
            config=data.get('config', {})
        )
        
        db.session.add(server)
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict())), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>', methods=['PUT'])
@jwt_required()
def update_server(server_id):
    """Atualiza servidor"""
    try:
        user_id = get_jwt_identity()
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        data = request.get_json()
        
        if 'name' in data:
            server.name = data['name']
        if 'host' in data:
            server.host = data['host']
        if 'port' in data:
            server.port = data['port']
        if 'api_key' in data:
            server.api_key = data['api_key']
        if 'config' in data:
            server.set_config(data['config'])
        
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>/activate', methods=['POST'])
@jwt_required()
def activate_server(server_id):
    """Ativa servidor (desativa os outros)"""
    try:
        user_id = get_jwt_identity()
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        # Desativar todos os servidores do usuário
        Server.query.filter_by(user_id=user_id).update({'is_active': False})
        
        # Ativar servidor selecionado
        server.is_active = True
        db.session.commit()
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/<int:server_id>', methods=['DELETE'])
@jwt_required()
def delete_server(server_id):
    """Deleta servidor"""
    try:
        user_id = get_jwt_identity()
        server = Server.query.filter_by(id=server_id, user_id=user_id).first()
        
        if not server:
            return jsonify(create_response(
                error='Servidor não encontrado',
                status=404
            )), 404
        
        db.session.delete(server)
        db.session.commit()
        
        return jsonify(create_response(data={'message': 'Servidor deletado'}))
        
    except Exception as e:
        db.session.rollback()
        return jsonify(create_response(error=str(e), status=500)), 500

@servers_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_server():
    """Retorna servidor ativo do usuário"""
    try:
        user_id = get_jwt_identity()
        server = Server.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not server:
            return jsonify(create_response(
                error='Nenhum servidor ativo',
                status=404
            )), 404
        
        return jsonify(create_response(data=server.to_dict()))
        
    except Exception as e:
        return jsonify(create_response(error=str(e), status=500)), 500
```

### **5. Middleware de Autenticação**

**`backend/middleware/auth.py`** (novo arquivo):
```python
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.server import Server
from utils.helpers import create_response

def get_current_server():
    """Obtém servidor ativo do usuário atual"""
    try:
        user_id = get_jwt_identity()
        server = Server.query.filter_by(user_id=user_id, is_active=True).first()
        return server
    except:
        return None

def require_server(f):
    """Decorator que garante que há um servidor ativo"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        server = get_current_server()
        
        if not server:
            return jsonify(create_response(
                error='Nenhum servidor ativo. Selecione um servidor primeiro.',
                status=400
            )), 400
        
        # Adiciona server ao contexto
        request.current_server = server
        return f(*args, **kwargs)
    
    return decorated_function
```

---

## 🎨 Implementação Frontend

### **1. Contexto de Autenticação**

**`frontend/src/contexts/AuthContext.jsx`** (novo arquivo):
```jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [activeServer, setActiveServer] = useState(null)

  // Configurar token no axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.status === 'success') {
        setUser(response.data.data)
        loadActiveServer()
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const loadActiveServer = async () => {
    try {
      const response = await api.get('/servers/active')
      if (response.data.status === 'success') {
        setActiveServer(response.data.data)
      }
    } catch (error) {
      console.error('Nenhum servidor ativo:', error)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      if (response.data.status === 'success') {
        const { token: newToken, user: userData } = response.data.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        await loadActiveServer()
        return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      })
      if (response.data.status === 'success') {
        const { token: newToken, user: userData } = response.data.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        await loadActiveServer()
        return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar'
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setActiveServer(null)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const activateServer = async (serverId) => {
    try {
      const response = await api.post(`/servers/${serverId}/activate`)
      if (response.data.status === 'success') {
        setActiveServer(response.data.data)
        return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao ativar servidor'
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    activeServer,
    login,
    register,
    logout,
    activateServer,
    loadActiveServer
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

### **2. Componente de Login**

**`frontend/src/components/Auth/Login.jsx`** (novo arquivo):
```jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <Typography align="center" sx={{ mt: 2 }}>
          Não tem conta?{' '}
          <Link href="/register" underline="hover">
            Registre-se
          </Link>
        </Typography>
      </Paper>
    </Box>
  )
}

export default Login
```

### **3. Seletor de Servidor**

**`frontend/src/components/Servers/ServerSelector.jsx`** (novo arquivo):
```jsx
import React, { useState, useEffect } from 'react'
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  IconButton
} from '@mui/material'
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const ServerSelector = () => {
  const { activeServer, activateServer, loadActiveServer } = useAuth()
  const [servers, setServers] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5000,
    api_key: ''
  })

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      const response = await api.get('/servers')
      if (response.data.status === 'success') {
        setServers(response.data.data.servers)
      }
    } catch (error) {
      console.error('Erro ao carregar servidores:', error)
    }
  }

  const handleServerChange = async (event) => {
    const serverId = event.target.value
    const result = await activateServer(serverId)
    if (result.success) {
      await loadActiveServer()
    }
  }

  const handleCreateServer = async () => {
    try {
      const response = await api.post('/servers', formData)
      if (response.data.status === 'success') {
        await loadServers()
        await activateServer(response.data.data.id)
        setOpenDialog(false)
        setFormData({ name: '', host: '', port: 5000, api_key: '' })
      }
    } catch (error) {
      console.error('Erro ao criar servidor:', error)
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Servidor Ativo</InputLabel>
        <Select
          value={activeServer?.id || ''}
          label="Servidor Ativo"
          onChange={handleServerChange}
        >
          {servers.map((server) => (
            <MenuItem key={server.id} value={server.id}>
              {server.name} ({server.host}:{server.port})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
      >
        Adicionar
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Adicionar Novo Servidor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Host (IP ou Domínio)"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Porta"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="API Key (Opcional)"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateServer} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ServerSelector
```

### **4. Rotas Protegidas**

**`frontend/src/components/Auth/ProtectedRoute.jsx`** (novo arquivo):
```jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
```

### **5. Atualizar App.jsx**

```jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Layout from './components/Layout'
// ... outros imports

function App() {
  const { darkMode } = useThemeStore()
  const theme = darkMode ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      {/* outras rotas */}
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

---

## 🚀 Passos de Implementação

### **1. Instalar Dependências**

```bash
cd backend
pip install flask-jwt-extended flask-sqlalchemy flask-migrate email-validator
```

### **2. Configurar Banco de Dados**

```bash
# Criar migração inicial
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### **3. Atualizar app.py**

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from models.user import db
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Inicializar extensões
db.init_app(app)
jwt = JWTManager(app)

# Criar tabelas (apenas em desenvolvimento)
with app.app_context():
    db.create_all()
```

### **4. Atualizar API Service**

**`frontend/src/services/api.js`**:
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 📱 Acesso Web Multi-Dispositivo

A interface já é uma **Single Page Application (SPA)** e funciona em qualquer dispositivo com navegador:

### **Características:**
- ✅ **Responsiva:** Material-UI é responsivo por padrão
- ✅ **PWA Ready:** Pode ser convertido em Progressive Web App
- ✅ **Acesso Remoto:** Funciona via IP público ou domínio
- ✅ **Mobile Friendly:** Interface adaptável para smartphones

### **Para Acesso Remoto:**

1. **Configurar Firewall:**
   ```bash
   # Permitir porta 5000 (backend) e 3000 (frontend)
   ```

2. **Usar IP Público ou Domínio:**
   - Frontend: `http://seu-ip:3000`
   - Backend: `http://seu-ip:5000`

3. **HTTPS (Recomendado):**
   - Usar Nginx como reverse proxy
   - Configurar certificado SSL (Let's Encrypt gratuito)

---

## 🔒 Segurança

### **Recomendações:**
1. **Senhas:** Hash com bcrypt (já implementado)
2. **Tokens:** JWT com expiração configurável
3. **HTTPS:** Sempre em produção
4. **CORS:** Configurar origens permitidas
5. **Rate Limiting:** Limitar tentativas de login
6. **Validação:** Validar todas as entradas

---

## 📊 Migração para Banco na Nuvem

Quando precisar migrar de SQLite para PostgreSQL (Supabase):

1. **Exportar dados do SQLite:**
   ```python
   # Script de migração
   ```

2. **Configurar Supabase:**
   - Criar projeto
   - Obter connection string
   - Atualizar `DATABASE_URL` no `.env`

3. **Atualizar modelos:**
   - SQLAlchemy funciona igual
   - Apenas mudar `SQLALCHEMY_DATABASE_URI`

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências
- [ ] Criar modelos (User, Server)
- [ ] Configurar banco de dados
- [ ] Implementar rotas de autenticação
- [ ] Implementar rotas de servidores
- [ ] Criar middleware de autenticação
- [ ] Atualizar rotas existentes para usar autenticação
- [ ] Criar contexto de autenticação no frontend
- [ ] Criar componentes de login/registro
- [ ] Criar seletor de servidor
- [ ] Adicionar rotas protegidas
- [ ] Testar fluxo completo
- [ ] Configurar acesso remoto (se necessário)

---

**Pronto para implementar!** 🚀

