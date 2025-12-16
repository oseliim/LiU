# Verificação Completa - Ubuntu 18.04

## ✅ Status das Configurações

### 1. Portas - ✅ CORRETO
- **Backend Flask**: Porta **5001** ✅
  - `backend/app.py` linha 146: `port=5001`
  - `backend/app.py` linha 154: `port=5001`
  
- **Frontend Vite**: Porta **3000** ✅
  - `frontend/vite.config.js` linha 8: `port: 3000`
  
- **Proxy Vite**: Apontando para **5001** ✅
  - `frontend/vite.config.js` linha 11: `target: 'http://localhost:5001'`
  - `frontend/vite.config.js` linha 15: `target: 'http://localhost:5001'`
  
- **WebSocket**: Apontando para **5001** ✅
  - `frontend/src/hooks/useWebSocket.js` linha 4: `url = 'http://localhost:5001'`

### 2. Node.js - ⚠️ REQUER ATUALIZAÇÃO
- **Versão atual**: v8.10.0 (muito antiga)
- **Versão necessária**: 14+ (recomendado 16+ ou 18+)
- **Solução**: Execute `install_nodejs_ubuntu18.sh`

### 3. Python - ⚠️ VERIFICAR VERSÃO
- **Ubuntu 18.04 padrão**: Python 3.6
- **Flask 3.0.0 requer**: Python 3.8+
- **Solução**: Instalar Python 3.8+ ou usar deadsnakes PPA

### 4. Dependências do Backend - ✅ COMPATÍVEIS
Todas as dependências são compatíveis com Python 3.8+:
- Flask 3.0.0 ✅
- flask-socketio 5.3.5 ✅
- flask-cors 4.0.0 ✅
- Outras dependências ✅

## 📋 Checklist de Instalação

### Passo 1: Verificar Python
```bash
python3 --version
# Se mostrar Python 3.6.x, precisa atualizar para 3.8+
```

### Passo 2: Instalar Python 3.8+ (se necessário)
```bash
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.8 python3.8-venv python3.8-dev
```

### Passo 3: Atualizar Node.js
```bash
cd ~/Documentos/LiU/files/GERENCIA
chmod +x install_nodejs_ubuntu18.sh
sudo ./install_nodejs_ubuntu18.sh
```

### Passo 4: Verificar Instalações
```bash
# Verificar Node.js
node -v  # Deve ser v14.x.x ou superior
npm -v   # Deve ser 6.x.x ou superior

# Verificar Python
python3.8 --version  # Deve ser 3.8.x ou superior
```

### Passo 5: Configurar Backend
```bash
cd ~/Documentos/LiU/files/GERENCIA/backend

# Criar venv com Python 3.8
python3.8 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt
```

### Passo 6: Configurar Frontend
```bash
cd ~/Documentos/LiU/files/GERENCIA/frontend

# Limpar instalação anterior
rm -rf node_modules package-lock.json

# Instalar dependências
npm install
```

### Passo 7: Verificar Portas
```bash
# Verificar se porta 5001 está livre
sudo lsof -i :5001
# Se houver processo, encerre: sudo kill -9 <PID>

# Verificar se porta 3000 está livre
sudo lsof -i :3000
# Se houver processo, encerre: sudo kill -9 <PID>
```

### Passo 8: Rodar o Sistema
```bash
cd ~/Documentos/LiU/files/GERENCIA
chmod +x run.sh
./run.sh
```

## 🔍 Verificações Finais

### Backend está funcionando?
```bash
curl http://localhost:5001/api/health
# Deve retornar: {"status": "ok", "version": "2.0"}
```

### Frontend está funcionando?
- Acesse: http://localhost:3000
- Deve mostrar a interface do sistema

### WebSocket está funcionando?
- Abra o console do navegador (F12)
- Deve mostrar: "WebSocket conectado"
- Não deve haver erros de conexão

## ⚠️ Problemas Conhecidos e Soluções

### Erro: "SyntaxError: Unexpected token import"
**Causa**: Node.js muito antigo (v8.10.0)
**Solução**: Execute `install_nodejs_ubuntu18.sh`

### Erro: "Port 5001 is in use"
**Causa**: Outro processo usando a porta
**Solução**: 
```bash
sudo lsof -i :5001
sudo kill -9 <PID>
```

### Erro: "ModuleNotFoundError: No module named 'flask'"
**Causa**: Ambiente virtual não ativado ou dependências não instaladas
**Solução**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Erro: "Python 3.6 não suporta Flask 3.0"
**Causa**: Python muito antigo
**Solução**: Instalar Python 3.8+ (ver Passo 2)

### Erro: "WebSocket connection failed"
**Causa**: Backend não está rodando ou porta errada
**Solução**: 
- Verificar se backend está rodando na porta 5001
- Verificar logs do backend para erros
- Verificar firewall

## 📝 Notas Importantes

1. **Porta 5000 vs 5001**: 
   - Porta 5000 é usada para servidores LTSP (configuração no modelo Server)
   - Porta 5001 é usada para o backend Flask
   - Não confundir!

2. **Python 3.8+ é obrigatório** para Flask 3.0.0

3. **Node.js 14+ é obrigatório** para Vite

4. **Documentação desatualizada**: Alguns arquivos de documentação ainda mencionam porta 5000, mas o código está correto usando 5001

## ✅ Resumo das Correções Aplicadas

- ✅ `vite.config.js` - Proxy atualizado para porta 5001
- ✅ `useWebSocket.js` - URL atualizada para porta 5001
- ✅ `run.sh` - Mensagem atualizada para porta 5001
- ✅ `install_nodejs_ubuntu18.sh` - Script criado para atualizar Node.js
- ✅ `CORRECAO_UBUNTU18.md` - Guia de correção criado
- ✅ `VERIFICACAO_UBUNTU18.md` - Este arquivo de verificação

