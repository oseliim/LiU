# 🔧 Solução para Erros 422 e 401

## 🔍 Problemas Identificados

### **Erro 422 (UNPROCESSABLE ENTITY)**
- Ocorre quando o Flask-JWT-Extended não consegue processar o token
- Geralmente significa que o token está malformado ou inválido

### **Erro 401 (UNAUTHORIZED)**
- Ocorre quando as credenciais estão incorretas
- Ou quando o token não está sendo enviado corretamente

---

## ✅ Correções Aplicadas

### **1. Handlers de Erro do JWT**

Adicionados handlers para melhor tratamento de erros:

```python
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify(create_response(error='Token expirado', status=401)), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Token inválido: {error}")
    return jsonify(create_response(error=f'Token inválido: {str(error)}', status=422)), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Token não fornecido: {error}")
    return jsonify(create_response(error='Token não fornecido', status=401)), 401
```

### **2. Validação de Token Melhorada**

Adicionada validação de `user_id` nas rotas protegidas:

```python
user_id = get_jwt_identity()
if not user_id:
    return jsonify(create_response(error='Token inválido', status=422)), 422
```

### **3. Logs de Debug**

Adicionados logs para facilitar diagnóstico:
- Logs no login
- Logs nos handlers de erro do JWT
- Logs nas rotas protegidas

### **4. Tratamento de Erros no Frontend**

Melhorado o tratamento de erros 404 (servidor não ativo) vs outros erros:

```javascript
if (error.response?.status === 404) {
  setActiveServer(null) // Esperado se não houver servidor
} else {
  console.error('Erro ao carregar servidor ativo:', error)
}
```

---

## 🚀 Como Testar

### **1. Limpar Token Antigo (se houver)**

No console do navegador:
```javascript
localStorage.removeItem('token')
```

### **2. Fazer Login Novamente**

1. Acesse `/login`
2. Digite username e password
3. Verifique se o token é salvo: `localStorage.getItem('token')`

### **3. Verificar Logs do Backend**

Os logs mostrarão:
- Se o token foi recebido
- Se o token é válido
- Qual erro específico ocorreu

---

## 🔍 Diagnóstico

### **Se ainda houver erro 422:**

1. **Verifique o token no localStorage:**
   ```javascript
   console.log(localStorage.getItem('token'))
   ```

2. **Verifique se o token está sendo enviado:**
   - Abra DevTools → Network
   - Veja a requisição
   - Verifique o header `Authorization: Bearer <token>`

3. **Verifique os logs do backend:**
   - Procure por "Token inválido" ou "Token não fornecido"

### **Se ainda houver erro 401 no login:**

1. **Verifique se o usuário existe:**
   ```powershell
   python check_database.py
   ```

2. **Verifique os logs do backend:**
   - Procure por "Usuário não encontrado" ou "Senha incorreta"

3. **Tente criar um novo usuário:**
   - Use a página de registro
   - Verifique se o usuário foi criado

---

## 📝 Checklist de Verificação

- [ ] Backend está rodando
- [ ] Banco de dados foi criado (`ltsp_manager.db` existe)
- [ ] Tabelas foram criadas (execute `python check_database.py`)
- [ ] Dependências instaladas (`flask-jwt-extended`, etc.)
- [ ] Token está sendo salvo no localStorage após login
- [ ] Token está sendo enviado no header Authorization
- [ ] JWT_SECRET_KEY está configurado

---

## 🛠️ Comandos Úteis

### **Verificar banco de dados:**
```powershell
cd backend
.\venv\Scripts\activate
python check_database.py
```

### **Limpar banco e recriar (CUIDADO: apaga todos os dados):**
```powershell
# Deletar banco
Remove-Item ltsp_manager.db

# Executar backend novamente para recriar
python app.py
```

### **Ver logs do backend:**
Os logs aparecem no console onde você executou `python app.py`

---

## ✅ Próximos Passos

1. **Reinicie o backend** para aplicar as correções
2. **Limpe o localStorage** do navegador
3. **Faça login novamente**
4. **Verifique os logs** se ainda houver erros

Se os erros persistirem, os logs do backend mostrarão exatamente qual é o problema!

