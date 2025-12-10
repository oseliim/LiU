# 🗄️ Guia de Banco de Dados - SQLite

## 📋 Visão Geral

O sistema usa **SQLite** como banco de dados, que é:
- ✅ **100% Gratuito** - Sem custos
- ✅ **Arquivo Local** - Um arquivo `.db` no diretório backend
- ✅ **Zero Configuração** - Funciona imediatamente
- ✅ **Criação Automática** - Tabelas criadas automaticamente

---

## 🚀 Criação Automática das Tabelas

As tabelas são criadas **automaticamente** quando você executa o backend pela primeira vez.

### **Como Funciona:**

No arquivo `backend/app.py`, há este código:

```python
# Criar tabelas do banco de dados (apenas em desenvolvimento)
with app.app_context():
    db.create_all()
```

Isso significa que:
1. Quando você executa `python app.py` pela primeira vez
2. O Flask cria o arquivo `ltsp_manager.db` (se não existir)
3. Cria todas as tabelas automaticamente (`users` e `servers`)

### **Localização do Banco:**

O arquivo do banco será criado em:
```
C:\Users\alvarodias\Documents\LiU\files\GERENCIA\backend\ltsp_manager.db
```

---

## ✅ Verificar se as Tabelas Foram Criadas

### **Método 1: Verificar se o arquivo existe**

```powershell
# No PowerShell, dentro do diretório backend
Test-Path ltsp_manager.db
```

Se retornar `True`, o banco foi criado.

### **Método 2: Executar o backend**

Quando você executar o backend pela primeira vez, as tabelas serão criadas automaticamente. Você verá no console algo como:

```
 * Running on http://0.0.0.0:5000
```

Se não houver erros, o banco foi criado com sucesso.

### **Método 3: Usar Python para verificar**

Crie um script temporário `check_db.py`:

```python
from app import app, db
from models import User, Server

with app.app_context():
    # Verificar se as tabelas existem
    print("Tabelas criadas:", db.engine.table_names())
    
    # Contar registros
    user_count = User.query.count()
    server_count = Server.query.count()
    
    print(f"Usuários: {user_count}")
    print(f"Servidores: {server_count}")
```

Execute:
```powershell
.\venv\Scripts\activate
python check_db.py
```

---

## 🔍 Ferramentas para Visualizar o Banco de Dados

### **Opção 1: DB Browser for SQLite (Recomendado)**

**Download:** https://sqlitebrowser.org/

**Como usar:**
1. Baixe e instale o DB Browser for SQLite
2. Abra o programa
3. Clique em "Open Database"
4. Navegue até: `C:\Users\alvarodias\Documents\LiU\files\GERENCIA\backend\ltsp_manager.db`
5. Clique em "Browse Data" para ver os dados
6. Clique em "Database Structure" para ver as tabelas

### **Opção 2: SQLite CLI (Linha de Comando)**

**Instalar SQLite:**
- Download: https://www.sqlite.org/download.html
- Ou usar via Python (já vem instalado)

**Comandos úteis:**

```powershell
# Ativar venv
.\venv\Scripts\activate

# Abrir SQLite CLI
python -c "import sqlite3; conn = sqlite3.connect('ltsp_manager.db'); cursor = conn.cursor(); cursor.execute('.tables'); print(cursor.fetchall())"
```

Ou criar um script Python:

```python
import sqlite3

conn = sqlite3.connect('ltsp_manager.db')
cursor = conn.cursor()

# Listar tabelas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tabelas:", tables)

# Ver estrutura da tabela users
cursor.execute("PRAGMA table_info(users);")
columns = cursor.fetchall()
print("\nColunas da tabela users:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Ver estrutura da tabela servers
cursor.execute("PRAGMA table_info(servers);")
columns = cursor.fetchall()
print("\nColunas da tabela servers:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Contar registros
cursor.execute("SELECT COUNT(*) FROM users;")
user_count = cursor.fetchone()[0]
print(f"\nTotal de usuários: {user_count}")

cursor.execute("SELECT COUNT(*) FROM servers;")
server_count = cursor.fetchone()[0]
print(f"Total de servidores: {server_count}")

conn.close()
```

### **Opção 3: Extensão VS Code**

Se você usa Visual Studio Code:
1. Instale a extensão "SQLite Viewer" ou "SQLite"
2. Clique com botão direito no arquivo `ltsp_manager.db`
3. Selecione "Open Database"

### **Opção 4: Online (SQLite Viewer)**

1. Acesse: https://sqliteviewer.app/
2. Faça upload do arquivo `ltsp_manager.db`
3. Visualize as tabelas e dados

---

## 📊 Estrutura das Tabelas

### **Tabela: `users`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Chave primária |
| `username` | VARCHAR(80) | Nome de usuário (único) |
| `email` | VARCHAR(120) | Email (único) |
| `password_hash` | VARCHAR(255) | Hash da senha |
| `created_at` | DATETIME | Data de criação |

### **Tabela: `servers`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Chave primária |
| `user_id` | INTEGER | FK para users.id |
| `name` | VARCHAR(100) | Nome do servidor |
| `host` | VARCHAR(255) | IP ou domínio |
| `port` | INTEGER | Porta (padrão: 5000) |
| `api_key` | VARCHAR(255) | Chave de API (opcional) |
| `is_active` | BOOLEAN | Servidor ativo |
| `config` | TEXT | Configurações em JSON |
| `created_at` | DATETIME | Data de criação |

---

## 🔧 Comandos SQL Úteis

### **Ver todos os usuários:**

```sql
SELECT id, username, email, created_at FROM users;
```

### **Ver todos os servidores:**

```sql
SELECT id, user_id, name, host, port, is_active FROM servers;
```

### **Ver servidores de um usuário específico:**

```sql
SELECT s.*, u.username 
FROM servers s 
JOIN users u ON s.user_id = u.id 
WHERE u.username = 'nome_do_usuario';
```

### **Ver servidor ativo de um usuário:**

```sql
SELECT s.*, u.username 
FROM servers s 
JOIN users u ON s.user_id = u.id 
WHERE u.id = 1 AND s.is_active = 1;
```

---

## 🛠️ Scripts Úteis

### **Script 1: Verificar Banco de Dados**

Crie `backend/check_database.py`:

```python
"""Script para verificar o banco de dados"""
from app import app, db
from models import User, Server

with app.app_context():
    print("=" * 50)
    print("VERIFICAÇÃO DO BANCO DE DADOS")
    print("=" * 50)
    
    # Verificar se o banco existe
    try:
        # Tentar conectar
        db.engine.connect()
        print("✅ Banco de dados conectado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        exit(1)
    
    # Listar tabelas
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Tabelas encontradas: {len(tables)}")
    for table in tables:
        print(f"   - {table}")
    
    # Contar registros
    print("\n📈 Estatísticas:")
    try:
        user_count = User.query.count()
        print(f"   Usuários: {user_count}")
    except:
        print("   Usuários: Tabela não encontrada")
    
    try:
        server_count = Server.query.count()
        print(f"   Servidores: {server_count}")
    except:
        print("   Servidores: Tabela não encontrada")
    
    # Listar usuários
    print("\n👥 Usuários:")
    users = User.query.all()
    if users:
        for user in users:
            servers = Server.query.filter_by(user_id=user.id).count()
            print(f"   - {user.username} ({user.email}) - {servers} servidor(es)")
    else:
        print("   Nenhum usuário cadastrado")
    
    print("\n" + "=" * 50)
```

**Executar:**
```powershell
.\venv\Scripts\activate
python check_database.py
```

### **Script 2: Criar Usuário Admin**

Crie `backend/create_admin.py`:

```python
"""Script para criar usuário administrador"""
from app import app, db
from models import User

with app.app_context():
    username = input("Username: ")
    email = input("Email: ")
    password = input("Password: ")
    
    # Verificar se já existe
    if User.query.filter_by(username=username).first():
        print("❌ Usuário já existe!")
        exit(1)
    
    # Criar usuário
    user = User(username=username, email=email)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    print(f"✅ Usuário {username} criado com sucesso!")
```

---

## 🔄 Migrações (Futuro)

Se você quiser usar migrações (recomendado para produção):

```powershell
# Instalar Flask-Migrate (já está no requirements.txt)
pip install flask-migrate

# Inicializar migrações
flask db init

# Criar migração inicial
flask db migrate -m "Initial migration"

# Aplicar migração
flask db upgrade
```

**Nota:** Por enquanto, `db.create_all()` é suficiente para desenvolvimento.

---

## 🚨 Solução de Problemas

### **Problema: "Tabela não encontrada"**

**Solução:**
1. Certifique-se de que executou o backend pelo menos uma vez
2. Verifique se o arquivo `ltsp_manager.db` existe
3. Execute o backend novamente para criar as tabelas

### **Problema: "Erro de permissão"**

**Solução:**
1. Verifique as permissões do diretório `backend`
2. Certifique-se de que o Python tem permissão de escrita

### **Problema: "Banco corrompido"**

**Solução:**
1. Faça backup do banco (se houver dados importantes)
2. Delete o arquivo `ltsp_manager.db`
3. Execute o backend novamente para recriar

---

## 📝 Resumo

1. **Criação Automática:** As tabelas são criadas automaticamente na primeira execução
2. **Localização:** `backend/ltsp_manager.db`
3. **Visualização:** Use DB Browser for SQLite (recomendado)
4. **Verificação:** Execute o backend e verifique se não há erros

**Pronto para usar!** 🚀

