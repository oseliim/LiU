# Guia de Instalação - Sistema de Gerenciamento Laboratorial LTSP v2.0

## Pré-requisitos

### Backend
- Python 3.8+
- pip
- sudo (para execução de scripts)

### Frontend
- Node.js 18+
- npm ou yarn

## Instalação

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite `.env` e configure:
   - `SECRET_KEY`: Chave secreta para Flask (gere uma chave segura)
   - Outras configurações conforme necessário

3. Certifique-se de que os scripts shell estão no diretório `scripts/`:
   - `liga.sh` - Ligar máquinas
   - `desliga.sh` - Desligar máquinas
   - `desliga_um.sh` - Desligar uma máquina
   - `ping.sh` - Verificar status
   - `executa.sh` - Executar comandos
   - `executa_um.sh` - Executar comando em uma máquina
   - `liga_net.sh` - Ligar internet
   - `desliga_net.sh` - Desligar internet
   - `crontab.sh` - Gerenciar crontab
   - `edit_crontab.sh` - Editar crontab

## Execução

### Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

O backend estará disponível em `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## Produção

### Backend com Gunicorn

```bash
cd backend
source venv/bin/activate
gunicorn -k eventlet -w 1 --bind 0.0.0.0:5000 app:app
```

### Frontend Build

```bash
cd frontend
npm run build
```

Os arquivos estarão em `frontend/dist/`. Configure um servidor web (nginx, Apache) para servir esses arquivos.

## Permissões

Os scripts precisam de permissões sudo. Configure sudoers para permitir execução sem senha:

```
usuario ALL=(ALL) NOPASSWD: /caminho/para/GERENCIA/scripts/*.sh
```

## Troubleshooting

### Erro de conexão WebSocket
- Verifique se o backend está rodando
- Verifique se a porta 5000 está acessível
- Verifique configurações de firewall

### Erro ao executar scripts
- Verifique permissões dos scripts: `chmod +x scripts/*.sh`
- Verifique se sudo está configurado corretamente
- Verifique logs do backend

### Erro ao instalar dependências Python
- Atualize pip: `pip install --upgrade pip`
- Use Python 3.8 ou superior

