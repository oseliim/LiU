# Correções Aplicadas

## Problema 1: Erro de Sintaxe no Layout.jsx

**Erro:** `Expected ")" but found "}"` na linha 86

**Causa:** O prop `button` está deprecated no Material-UI v5

**Solução:** Removido o prop `button` e adicionado estilos customizados com `sx`

## Problema 2: Erro de Compilação do pydantic-core

**Erro:** `pydantic-core` precisa de Rust para compilar

**Causa:** pydantic 2.5.2 requer Rust toolchain

**Solução:** 
- Removido `pydantic` das dependências essenciais
- Criado `requirements-minimal.txt` sem dependências que precisam compilar
- Dependências opcionais comentadas

## Como Instalar Agora

### Opção 1: Usar requirements-minimal.txt (Recomendado)

```bash
cd backend
venv\Scripts\activate
pip install -r requirements-minimal.txt
```

### Opção 2: Instalar apenas o essencial

```bash
cd backend
venv\Scripts\activate
pip install flask flask-socketio flask-cors flask-caching python-socketio psutil py-cpuinfo python-dotenv werkzeug eventlet
```

## Próximos Passos

1. Reinstale as dependências do backend usando `requirements-minimal.txt`
2. O frontend deve funcionar agora com a correção do Layout.jsx
3. Execute novamente: `.\start.bat`

