# 🔍 Debug: Erro 422 com Token JWT

## 📋 Problema

Erro 422 (UNPROCESSABLE ENTITY) em todas as rotas protegidas:
- `/api/auth/me`
- `/api/servers/active`
- `/api/servers`

## ✅ Correções Aplicadas

### **1. Validação de Token no Frontend**

Adicionada validação do formato do token antes de usar:

```javascript
// Verificar se o token tem formato válido (JWT tem 3 partes separadas por ponto)
const tokenParts = token.split('.')
if (tokenParts.length !== 3) {
  console.error('Token inválido: formato incorreto')
  logout()
  return
}
```

### **2. Validação ao Receber Token**

Validação quando o token é recebido do servidor:

```javascript
if (!newToken || typeof newToken !== 'string') {
  console.error('Token inválido recebido do servidor')
  return { success: false, error: 'Token inválido recebido' }
}

const tokenParts = newToken.split('.')
if (tokenParts.length !== 3) {
  console.error('Token malformado:', newToken)
  return { success: false, error: 'Token malformado' }
}
```

### **3. Logs de Debug no Backend**

Adicionados logs para diagnosticar problemas:

- **No login/registro:** Log dos primeiros 20 caracteres do token criado
- **No handler de erro:** Log completo do erro quando token é inválido
- **No middleware:** Log do token recebido em cada requisição (apenas em debug)

### **4. Tratamento de Erros 422**

Melhorado tratamento de erros 422 no interceptor do axios:

```javascript
if (error.response.status === 401 || error.response.status === 422) {
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
  // ...
}
```

---

## 🔧 Como Diagnosticar

### **1. Verificar Token no LocalStorage**

No console do navegador:
```javascript
const token = localStorage.getItem('token')
console.log('Token:', token)
console.log('Partes:', token?.split('.').length) // Deve ser 3
```

### **2. Verificar Logs do Backend**

Os logs mostrarão:
- Token criado no login/registro
- Token recebido em cada requisição
- Erro específico quando token é inválido

### **3. Verificar Header Authorization**

No DevTools → Network:
- Abra uma requisição que falhou
- Veja o header `Authorization`
- Deve ser: `Bearer <token>`

---

## 🚀 Próximos Passos

1. **Limpar localStorage:**
   ```javascript
   localStorage.removeItem('token')
   ```

2. **Fazer login novamente**

3. **Verificar logs do backend** para ver:
   - Se o token foi criado corretamente
   - Se o token está sendo recebido corretamente
   - Qual erro específico está ocorrendo

4. **Se o problema persistir:**
   - Verifique se o `JWT_SECRET_KEY` está configurado
   - Verifique se o token não está sendo corrompido
   - Verifique se há múltiplas instâncias do backend rodando

---

## 🔍 Possíveis Causas

1. **Token malformado:** Token não tem 3 partes (header.payload.signature)
2. **JWT_SECRET_KEY diferente:** Chave mudou entre criação e validação
3. **Token corrompido:** Token foi modificado no localStorage
4. **Múltiplos backends:** Diferentes instâncias com diferentes chaves
5. **Token antigo:** Token criado antes de mudanças na configuração

---

## ✅ Checklist

- [ ] Token tem 3 partes separadas por ponto
- [ ] Token começa com caracteres válidos (não é null/undefined)
- [ ] JWT_SECRET_KEY está configurado no backend
- [ ] Apenas uma instância do backend está rodando
- [ ] Token foi criado após as últimas mudanças

---

## 🛠️ Comandos Úteis

### **Limpar tudo e recomeçar:**
```javascript
// No console do navegador
localStorage.clear()
location.reload()
```

### **Verificar token atual:**
```javascript
const token = localStorage.getItem('token')
if (token) {
  const parts = token.split('.')
  console.log('Partes do token:', parts.length)
  console.log('Token (primeiros 50 chars):', token.substring(0, 50))
} else {
  console.log('Nenhum token encontrado')
}
```

---

**Se o problema persistir, os logs do backend mostrarão exatamente qual é o erro!**

