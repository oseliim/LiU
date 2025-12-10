# Sistema de Gerenciamento Laboratorial LTSP - Versão 2.0

Sistema moderno de gerenciamento de laboratórios LTSP com interface React e API Flask.

## 🚀 Tecnologias

### Backend
- Flask 3.0+
- Flask-SocketIO (WebSocket)
- Flask-CORS
- SQLAlchemy
- Redis (cache)
- Celery (tarefas assíncronas)

### Frontend
- React 18+
- Vite
- React Router
- Zustand (gerenciamento de estado)
- Socket.io-client
- Recharts (gráficos)
- Material-UI / Tailwind CSS

## 📁 Estrutura do Projeto

```
GERENCIA/
├── backend/              # API Flask
│   ├── app.py           # Aplicação principal
│   ├── routes/          # Blueprints de rotas
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos de dados
│   └── utils/           # Utilitários
├── frontend/            # Aplicação React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # Serviços API
│   │   └── store/       # Estado global
│   └── package.json
└── scripts/             # Scripts shell (herdados)
```

## 🛠️ Instalação

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🏃 Execução

### Backend
```bash
cd backend
python app.py
```

### Frontend
```bash
cd frontend
npm run dev
```

## 📝 Funcionalidades

- ✅ Dashboard em tempo real
- ✅ Gerenciamento de máquinas (ligar/desligar)
- ✅ Monitoramento de recursos do servidor
- ✅ Execução de comandos remotos
- ✅ Agendamento de ações (Cron)
- ✅ Analytics e relatórios
- ✅ Notificações em tempo real
- ✅ Autenticação e autorização
- ✅ Histórico de ações

## 🔐 Segurança

- Autenticação JWT
- Rate limiting
- Validação de inputs
- Sanitização de comandos
- Auditoria de ações

## 📊 Performance

- WebSocket para atualizações em tempo real
- Cache Redis
- Code splitting no frontend
- Virtualização de listas grandes
- Lazy loading de componentes

