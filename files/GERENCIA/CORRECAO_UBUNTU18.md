# Correção para Ubuntu 18.04

Este documento explica como corrigir os problemas encontrados ao rodar o sistema no Ubuntu 18.04.

## Problemas Identificados

1. **Node.js v8.10.0 é muito antigo**: Vite requer Node.js 14+ (preferencialmente 16+)
2. **Portas inconsistentes**: Backend está na porta 5001, mas frontend estava configurado para 5000
3. **Erro 404 na rota `/api/servers/active`**: Backend não estava rodando ou na porta errada
4. **Erro de conexão WebSocket**: Frontend tentando conectar na porta errada

## Solução

### Passo 1: Atualizar Node.js

Execute o script de instalação do Node.js:

```bash
cd files/GERENCIA
chmod +x install_nodejs_ubuntu18.sh
sudo ./install_nodejs_ubuntu18.sh
```

Este script irá:
- Verificar a versão atual do Node.js
- Instalar Node.js 18.x (compatível com Ubuntu 18.04)
- Verificar a instalação

**Alternativa manual:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Passo 2: Verificar Instalação

```bash
node -v  # Deve mostrar v18.x.x ou superior
npm -v   # Deve mostrar 9.x.x ou superior
```

### Passo 3: Reinstalar Dependências do Frontend

```bash
cd files/GERENCIA/frontend
rm -rf node_modules package-lock.json
npm install
```

### Passo 4: Verificar Portas

O backend está configurado para rodar na **porta 5001**. As seguintes configurações foram atualizadas:

- ✅ `vite.config.js` - proxy atualizado para porta 5001
- ✅ `useWebSocket.js` - URL atualizada para porta 5001
- ✅ `run.sh` - mensagem atualizada

### Passo 5: Verificar se a Porta 5001 está Livre

```bash
# Verificar se algo está usando a porta 5001
sudo lsof -i :5001
# ou
sudo netstat -tulpn | grep 5001

# Se houver processo, encerre-o:
# sudo kill -9 <PID>
```

### Passo 6: Rodar o Sistema

**Opção A: Script Automático**
```bash
cd files/GERENCIA
chmod +x run.sh
./run.sh
```

**Opção B: Manual (2 terminais)**

Terminal 1 - Backend:
```bash
cd files/GERENCIA/backend
source venv/bin/activate  # ou: python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Terminal 2 - Frontend:
```bash
cd files/GERENCIA/frontend
npm run dev
```

### Passo 7: Acessar o Sistema

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api/health
- WebSocket: ws://localhost:5001/socket.io

## Verificação

### Backend está funcionando?
```bash
curl http://localhost:5001/api/health
# Deve retornar: {"status": "ok", "version": "2.0"}
```

### Frontend está funcionando?
- Acesse: http://localhost:3000
- Deve mostrar a interface do sistema

## Problemas Comuns

### Erro: "Port 5001 is in use"
```bash
# Encontrar processo usando a porta
sudo lsof -i :5001
# Encerrar processo
sudo kill -9 <PID>
```

### Erro: "Cannot find module" no frontend
```bash
cd files/GERENCIA/frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro: "SyntaxError: Unexpected token import"
- Certifique-se de que atualizou o Node.js para versão 14+
- Verifique com: `node -v`

### Erro: WebSocket connection failed
- Verifique se o backend está rodando na porta 5001
- Verifique se não há firewall bloqueando
- Verifique os logs do backend para erros

## Notas

- A porta padrão do backend é **5001** (não 5000)
- O frontend roda na porta **3000** e faz proxy para o backend na porta **5001**
- O modelo `Server` usa porta 5000 como padrão para servidores LTSP (não o backend Flask)


