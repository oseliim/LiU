# 🔐 Implementação de SRI (Subresource Integrity)

Este guia explica como implementar e gerenciar SRI no projeto LiU para proteger contra vulnerabilidades em pacotes CDN.

## 🚀 Início Rápido

### 1. Gerar Hashes SRI
```bash
# Opção 1: Scripts Bash
./generate-sri.sh

# Opção 2: Script Python (mais robusto)
python3 sri_manager.py generate
```

### 2. Aplicar nos Templates
```bash
# Opção 1: Scripts Bash
./apply-sri.sh

# Opção 2: Script Python
python3 sri_manager.py apply
```

### 3. Validar Implementação
```bash
# Opção 1: Scripts Bash
./validate-sri.sh

# Opção 2: Script Python
python3 sri_manager.py validate
```

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `guia_implementacao_sri.md` | Guia completo de implementação |
| `generate-sri.sh` | Script bash para gerar hashes |
| `apply-sri.sh` | Script bash para aplicar SRI |
| `validate-sri.sh` | Script bash para validar SRI |
| `sri_manager.py` | Script Python completo |
| `exemplo_templates_com_sri.html` | Exemplo de templates com SRI |
| `README_SRI.md` | Este arquivo |

## 🛠️ Scripts Disponíveis

### Scripts Bash
- **`generate-sri.sh`**: Gera hashes SRI para todas as CDNs
- **`apply-sri.sh`**: Aplica hashes nos templates HTML
- **`validate-sri.sh`**: Valida se os hashes estão corretos

### Script Python (Recomendado)
- **`sri_manager.py generate`**: Gera hashes SRI
- **`sri_manager.py apply`**: Aplica hashes nos templates
- **`sri_manager.py validate`**: Valida implementação
- **`sri_manager.py monitor`**: Monitora mudanças nos recursos
- **`sri_manager.py check`**: Verifica implementação nos templates

## 📦 Recursos CDN Protegidos

### Interface de Gerenciamento
- Bootstrap CSS 5.3.0
- Bootstrap JS 5.3.0
- Chart.js (latest)

### App Flask
- Bootstrap CSS 5.3.3
- Bootstrap JS 5.3.3
- Bootstrap Icons 1.11.3

## 🔍 Como Funciona

### 1. Geração de Hash
```bash
# O script baixa o recurso e calcula SHA-384
curl -s "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" | \
openssl dgst -sha384 -binary | openssl base64 -A
```

### 2. Aplicação no HTML
```html
<!-- Antes -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Depois -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
      rel="stylesheet" 
      integrity="sha384-EXAMPLED_HASH_HERE" 
      crossorigin="anonymous">
```

### 3. Validação pelo Navegador
- O navegador baixa o recurso
- Calcula o hash SHA-384
- Compara com o hash no atributo `integrity`
- Bloqueia o recurso se os hashes não coincidirem

## 🚨 Cenários de Proteção

### 1. Supply Chain Attack
```
CDN Comprometido → Código Malicioso → SRI Bloqueia → Usuário Protegido
```

### 2. Man-in-the-Middle
```
Interceptação → Modificação → Hash Diferente → SRI Bloqueia
```

### 3. Cache Poisoning
```
Cache Infectado → Conteúdo Malicioso → SRI Valida → Bloqueio
```

## 📋 Checklist de Implementação

- [ ] Executar `generate-sri.sh` ou `python3 sri_manager.py generate`
- [ ] Executar `apply-sri.sh` ou `python3 sri_manager.py apply`
- [ ] Executar `validate-sri.sh` ou `python3 sri_manager.py validate`
- [ ] Testar aplicação no navegador
- [ ] Verificar console do DevTools (sem erros de SRI)
- [ ] Confirmar que todos os recursos carregam (status 200)

## 🔄 Manutenção Contínua

### Monitoramento Automático
```bash
# Verificar mudanças nos recursos CDN
python3 sri_manager.py monitor

# Verificar implementação nos templates
python3 sri_manager.py check
```

### Atualização de Versões
Quando atualizar versões dos pacotes:

1. **Atualizar URLs** nos templates
2. **Gerar novos hashes**: `python3 sri_manager.py generate`
3. **Aplicar novos hashes**: `python3 sri_manager.py apply`
4. **Validar implementação**: `python3 sri_manager.py validate`

### CI/CD Integration
```yaml
# .github/workflows/sri-check.yml
name: SRI Validation
on: [push, pull_request]
jobs:
  validate-sri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests
      - name: Validate SRI
        run: python3 sri_manager.py validate
```

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
- Verificar se a URL está correta
- Verificar conectividade com a internet
- Verificar se o CDN está funcionando

### Erro: "Integrity check failed"
- O recurso foi alterado no CDN
- Executar `python3 sri_manager.py generate` para novos hashes
- Executar `python3 sri_manager.py apply` para aplicar

### Recurso não carrega
- Verificar se o hash SRI está correto
- Verificar se `crossorigin="anonymous"` está presente
- Verificar console do navegador para erros

### Script não executa
```bash
# Dar permissão de execução
chmod +x generate-sri.sh apply-sri.sh validate-sri.sh sri_manager.py
```

## 📊 Benefícios

### Segurança
- ✅ Proteção contra supply chain attacks
- ✅ Verificação de integridade automática
- ✅ Prevenção de cache poisoning
- ✅ Detecção de modificações não autorizadas

### Conformidade
- ✅ OWASP Top 10 compliance
- ✅ Padrões de segurança web
- ✅ Auditoria de segurança

### Confiabilidade
- ✅ Validação contínua de recursos
- ✅ Alertas automáticos de mudanças
- ✅ Monitoramento proativo

## 🔗 Recursos Adicionais

- [MDN - Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [OWASP - Subresource Integrity](https://owasp.org/www-community/controls/Subresource_Integrity)
- [W3C SRI Specification](https://www.w3.org/TR/SRI/)

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar este README
2. Consultar `guia_implementacao_sri.md`
3. Executar `python3 sri_manager.py check` para diagnóstico
4. Verificar logs de erro nos scripts

---

**⚠️ Importante**: SRI é uma camada adicional de segurança. Mantenha sempre as versões dos pacotes atualizadas e monitore vulnerabilidades conhecidas.
