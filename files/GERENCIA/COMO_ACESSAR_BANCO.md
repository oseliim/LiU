# 🗄️ Como Acessar o Banco de Dados

## ✅ As Tabelas São Criadas Automaticamente!

Quando você executar o backend pela primeira vez, as tabelas são criadas automaticamente.

### **Passo a Passo:**

1. **Execute o backend:**
   ```powershell
   cd backend
   .\venv\Scripts\activate
   python app.py
   ```

2. **O banco será criado automaticamente em:**
   ```
   C:\Users\alvarodias\Documents\LiU\files\GERENCIA\backend\ltsp_manager.db
   ```

3. **Verificar se foi criado:**
   ```powershell
   Test-Path ltsp_manager.db
   ```
   Se retornar `True`, está criado! ✅

---

## 🔍 Como Visualizar o Banco de Dados

### **Opção 1: DB Browser for SQLite (Mais Fácil)**

1. **Baixe:** https://sqlitebrowser.org/
2. **Instale** o programa
3. **Abra** o DB Browser
4. **Clique** em "Open Database"
5. **Navegue** até: `backend\ltsp_manager.db`
6. **Clique** em "Browse Data" para ver os dados

### **Opção 2: Script Python (Rápido)**

Execute o script que criei:

```powershell
cd backend
.\venv\Scripts\activate
python check_database.py
```

Isso mostrará:
- ✅ Se o banco está conectado
- 📊 Quais tabelas existem
- 📈 Quantos usuários e servidores há
- 👥 Lista de usuários
- 🖥️ Lista de servidores

---

## 📊 Estrutura das Tabelas

### **Tabela: `users`**
- `id` - ID único
- `username` - Nome de usuário
- `email` - Email
- `password_hash` - Senha criptografada
- `created_at` - Data de criação

### **Tabela: `servers`**
- `id` - ID único
- `user_id` - ID do usuário dono
- `name` - Nome do servidor
- `host` - IP ou domínio
- `port` - Porta
- `api_key` - Chave de API (opcional)
- `is_active` - Se está ativo
- `config` - Configurações em JSON
- `created_at` - Data de criação

---

## 🚀 Verificar Agora

Execute estes comandos no PowerShell:

```powershell
# 1. Ir para o diretório backend
cd C:\Users\alvarodias\Documents\LiU\files\GERENCIA\backend

# 2. Ativar ambiente virtual
.\venv\Scripts\activate

# 3. Verificar se o banco existe
Test-Path ltsp_manager.db

# 4. Se não existir, execute o backend uma vez para criar
# python app.py
# (Pressione Ctrl+C para parar)

# 5. Verificar o banco
python check_database.py
```

---

## 📝 Resumo

- ✅ **Criação:** Automática na primeira execução do backend
- 📁 **Localização:** `backend/ltsp_manager.db`
- 🔍 **Visualizar:** DB Browser for SQLite ou script Python
- ✅ **Verificar:** Execute `python check_database.py`

**Pronto!** 🎉

