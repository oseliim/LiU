# 🚀 Como Rodar o Sistema de Gerenciamento Laboratorial LTSP v2.0

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Python 3.8 ou superior**
- **Node.js 18+ e npm** (ou yarn)
- **Git** (opcional)

## 🔧 Passo 1: Preparar os Scripts

Primeiro, copie os scripts do sistema antigo para o novo:

```bash
# No Windows (PowerShell)
cd files\GERENCIA
xcopy ..\interface_gerencia\scripts\*.sh scripts\ /Y
xcopy ..\interface_gerencia\scripts\maquinas scripts\ /Y
xcopy ..\interface_gerencia\scripts\mac_maquinas scripts\ /Y

# No Linux/Mac
cd files/GERENCIA
cp ../interface_gerencia/scripts/*.sh scripts/
cp ../interface_gerencia/scripts/maquinas scripts/ 2>/dev/null || true
cp ../interface_gerencia/scripts/mac_maquinas scripts/ 2>/dev/null || true
```

## 🐍 Passo 2: Configurar o Backend

### 2.1. Criar ambiente virtual Python

```bash
cd files\GERENCIA\backend

# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2.2. Instalar dependências

```bash
pip install -r requirements.txt
```

**Nota:** Se houver erro com alguma dependência, você pode instalar apenas as essenciais:

```bash
pip install flask flask-socketio flask-cors flask-caching python-socketio psutil py-cpuinfo python-dotenv werkzeug eventlet
```

### 2.3. Criar arquivo .env (opcional)

```bash
# No diretório backend, crie um arquivo .env
echo SECRET_KEY=minha-chave-secreta-aqui > .env
```

## ⚛️ Passo 3: Configurar o Frontend

### 3.1. Instalar dependências Node.js

```bash
cd files\GERENCIA\frontend
npm install
```

**Nota:** Se houver problemas, tente:

```bash
npm install --legacy-peer-deps
```

## 🎯 Passo 4: Executar o Sistema

Você precisa executar **dois processos simultaneamente** (backend e frontend).

### Opção A: Dois Terminais (Recomendado)

#### Terminal 1 - Backend:
```bash
cd files\GERENCIA\backend
venv\Scripts\activate  # Windows
# ou: source venv/bin/activate  # Linux/Mac
python app.py
```

Você verá algo como:
```
 * Running on http://0.0.0.0:5000
```

#### Terminal 2 - Frontend:
```bash
cd files\GERENCIA\frontend
npm run dev
```

Você verá algo como:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Opção B: Script Automático (Linux/Mac)

Se estiver no Linux/Mac, você pode usar o script `run.sh`:

```bash
cd files/GERENCIA
chmod +x run.sh
./run.sh
```

## 🌐 Passo 5: Acessar o Sistema

1. Abra seu navegador
2. Acesse: **http://localhost:3000**
3. O sistema estará rodando!

## ✅ Verificação

### Backend está funcionando?
- Acesse: http://localhost:5000/api/health
- Deve retornar: `{"status": "ok", "version": "2.0"}`

### Frontend está funcionando?
- Acesse: http://localhost:3000
- Deve mostrar a interface do sistema

## 🔍 Solução de Problemas

### Erro: "Module not found" no backend
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Erro: "Cannot find module" no frontend
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port already in use"
- Backend na porta 5000: Feche outros processos Flask
- Frontend na porta 3000: Feche outros processos Node ou mude a porta no `vite.config.js`

### Erro: "Script não encontrado"
- Certifique-se de que copiou os scripts para `GERENCIA/scripts/`
- Verifique se os scripts têm permissão de execução (Linux/Mac): `chmod +x scripts/*.sh`

### Erro de conexão WebSocket
- Verifique se o backend está rodando na porta 5000
- Verifique se não há firewall bloqueando
- No Windows, pode ser necessário permitir na firewall

## 📝 Primeiro Uso

1. **Configurar faixa de IPs:**
   - Vá em "Máquinas" → "Configurar IPs"
   - Digite a faixa: `10.100.64.100 - 10.100.64.150`
   - Clique em "Confirmar"

2. **Verificar status:**
   - Clique em "Atualizar" para verificar status das máquinas

3. **Explorar o sistema:**
   - Dashboard: Visão geral
   - Máquinas: Gerenciar computadores
   - Monitoramento: Métricas do servidor
   - Comandos: Executar comandos remotos
   - Agendamento: Configurar ações automáticas

## 🛑 Parar o Sistema

Para parar o sistema:

1. **No terminal do backend:** Pressione `Ctrl+C`
2. **No terminal do frontend:** Pressione `Ctrl+C`

## 📚 Próximos Passos

- Configure permissões sudo para os scripts (se necessário)
- Configure variáveis de ambiente no `.env`
- Leia a documentação completa em `README.md`

## 💡 Dicas

- Mantenha ambos os terminais abertos enquanto usar o sistema
- O backend deve estar rodando antes do frontend
- Use `Ctrl+C` para parar os processos
- Em caso de erro, verifique os logs nos terminais

---

**Pronto!** Seu sistema está rodando! 🎉

