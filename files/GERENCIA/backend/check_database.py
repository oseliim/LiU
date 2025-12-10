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
        print("💡 Execute o backend primeiro para criar o banco de dados")
        exit(1)
    
    # Listar tabelas
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n📊 Tabelas encontradas: {len(tables)}")
        for table in tables:
            print(f"   - {table}")
    except Exception as e:
        print(f"\n⚠️  Erro ao listar tabelas: {e}")
        print("💡 As tabelas serão criadas na primeira execução do backend")
    
    # Contar registros
    print("\n📈 Estatísticas:")
    try:
        user_count = User.query.count()
        print(f"   Usuários: {user_count}")
    except Exception as e:
        print(f"   Usuários: Erro - {e}")
    
    try:
        server_count = Server.query.count()
        print(f"   Servidores: {server_count}")
    except Exception as e:
        print(f"   Servidores: Erro - {e}")
    
    # Listar usuários
    print("\n👥 Usuários:")
    try:
        users = User.query.all()
        if users:
            for user in users:
                try:
                    servers = Server.query.filter_by(user_id=user.id).count()
                    print(f"   - {user.username} ({user.email}) - {servers} servidor(es)")
                except:
                    print(f"   - {user.username} ({user.email})")
        else:
            print("   Nenhum usuário cadastrado")
    except Exception as e:
        print(f"   Erro ao listar usuários: {e}")
    
    # Listar servidores
    print("\n🖥️  Servidores:")
    try:
        servers = Server.query.all()
        if servers:
            for server in servers:
                user = User.query.get(server.user_id)
                status = "✅ ATIVO" if server.is_active else "⏸️  Inativo"
                print(f"   - {server.name} ({server.host}:{server.port}) - {status} - Usuário: {user.username if user else 'N/A'}")
        else:
            print("   Nenhum servidor cadastrado")
    except Exception as e:
        print(f"   Erro ao listar servidores: {e}")
    
    print("\n" + "=" * 50)

