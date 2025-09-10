# Guia de Implementação de SRI (Subresource Integrity)

## O que é SRI?

SRI (Subresource Integrity) é um mecanismo de segurança que permite verificar a integridade de recursos externos (CSS, JS) carregados via CDN. Ele protege contra:

- **Supply Chain Attacks**: Quando um CDN é comprometido
- **Man-in-the-Middle**: Interceptação e modificação de recursos
- **Cache Poisoning**: Injeção de código malicioso em caches
- **Version Drift**: Mudanças não autorizadas em versões específicas

## CDNs Identificadas no Projeto

### 1. Interface de Gerenciamento (`files/interface_gerencia/templates/index.html`)
- Bootstrap CSS 5.3.0
- Bootstrap JS 5.3.0
- Chart.js (latest)

### 2. App Flask (`files/app_flask/src/templates/`)
- Bootstrap CSS 5.3.3
- Bootstrap JS 5.3.3
- Bootstrap Icons 1.11.3

## Implementação de SRI

### Passo 1: Gerar Hashes SRI

Para cada CDN, você precisa gerar o hash SHA-384. Use uma das seguintes ferramentas:

#### Opção A: Ferramenta Online
```bash
# Acesse: https://www.srihash.org/
# Cole a URL do CDN e gere o hash
```

#### Opção B: Script Local (Node.js)
```javascript
// sri-generator.js
const crypto = require('crypto');
const https = require('https');

function generateSRI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                const hash = crypto.createHash('sha384').update(data).digest('base64');
                resolve(`sha384-${hash}`);
            });
        }).on('error', reject);
    });
}

// URLs do projeto
const urls = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
];

async function generateAllSRIs() {
    for (const url of urls) {
        try {
            const sri = await generateSRI(url);
            console.log(`${url}: ${sri}`);
        } catch (error) {
            console.error(`Erro para ${url}:`, error.message);
        }
    }
}

generateAllSRIs();
```

#### Opção C: Comando cURL + OpenSSL
```bash
#!/bin/bash
# generate-sri.sh

generate_sri() {
    local url="$1"
    local hash=$(curl -s "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
    echo "sha384-$hash"
}

echo "Bootstrap 5.3.0 CSS:"
generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"

echo "Bootstrap 5.3.0 JS:"
generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"

echo "Chart.js:"
generate_sri "https://cdn.jsdelivr.net/npm/chart.js"

echo "Bootstrap 5.3.3 CSS:"
generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"

echo "Bootstrap 5.3.3 JS:"
generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"

echo "Bootstrap Icons:"
generate_sri "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
```

### Passo 2: Aplicar SRI nos Templates

#### Interface de Gerenciamento (`files/interface_gerencia/templates/index.html`)

**Antes:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

**Depois:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
      rel="stylesheet" 
      integrity="sha384-EXAMPLED_HASH_HERE" 
      crossorigin="anonymous">

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" 
        integrity="sha384-EXAMPLED_HASH_HERE" 
        crossorigin="anonymous"></script>

<script src="https://cdn.jsdelivr.net/npm/chart.js" 
        integrity="sha384-EXAMPLED_HASH_HERE" 
        crossorigin="anonymous"></script>
```

#### App Flask Templates

**Bootstrap 5.3.3 CSS:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
      rel="stylesheet" 
      integrity="sha384-EXAMPLED_HASH_HERE" 
      crossorigin="anonymous">
```

**Bootstrap 5.3.3 JS:**
```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
        integrity="sha384-EXAMPLED_HASH_HERE" 
        crossorigin="anonymous"></script>
```

**Bootstrap Icons:**
```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" 
      integrity="sha384-EXAMPLED_HASH_HERE" 
      crossorigin="anonymous">
```

### Passo 3: Script de Automação

Crie um script para automatizar a verificação e atualização de SRI:

```python
# sri_manager.py
import hashlib
import requests
import re
from pathlib import Path

class SRIManager:
    def __init__(self):
        self.templates_dir = Path("files")
        
    def generate_sri(self, url):
        """Gera hash SRI para uma URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.content
            hash_obj = hashlib.sha384(content)
            hash_b64 = hash_obj.digest().encode('base64').decode().strip()
            
            return f"sha384-{hash_b64}"
        except Exception as e:
            print(f"Erro ao gerar SRI para {url}: {e}")
            return None
    
    def update_template_sri(self, template_path, url_patterns):
        """Atualiza hashes SRI em um template"""
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = False
        for pattern, url in url_patterns.items():
            # Gera novo hash
            new_sri = self.generate_sri(url)
            if not new_sri:
                continue
                
            # Regex para encontrar e substituir
            regex = rf'({re.escape(pattern)}[^>]*?)(integrity="[^"]*")?([^>]*?>)'
            
            def replace_func(match):
                before = match.group(1)
                after = match.group(3)
                return f'{before}integrity="{new_sri}" crossorigin="anonymous"{after}'
            
            new_content = re.sub(regex, replace_func, content)
            if new_content != content:
                updated = True
                content = new_content
        
        if updated:
            with open(template_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Atualizado: {template_path}")
    
    def update_all_templates(self):
        """Atualiza todos os templates do projeto"""
        # Padrões de URL para cada template
        templates = {
            "files/interface_gerencia/templates/index.html": {
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
                "https://cdn.jsdelivr.net/npm/chart.js": "https://cdn.jsdelivr.net/npm/chart.js"
            },
            "files/app_flask/src/templates/index.html": {
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
            },
            "files/app_flask/src/templates/expresso.html": {
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css": "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
            },
            "files/app_flask/src/templates/wizard.html": {
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css": "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
            }
        }
        
        for template_path, url_patterns in templates.items():
            if Path(template_path).exists():
                self.update_template_sri(template_path, url_patterns)
            else:
                print(f"Template não encontrado: {template_path}")

if __name__ == "__main__":
    manager = SRIManager()
    manager.update_all_templates()
```

### Passo 4: Validação e Testes

#### Script de Validação
```python
# validate_sri.py
import requests
import hashlib
import re
from pathlib import Path

def validate_sri_in_template(template_path):
    """Valida se os hashes SRI estão corretos"""
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Encontra todos os recursos com SRI
    sri_pattern = r'(?:src|href)="([^"]+)"[^>]*integrity="([^"]+)"'
    matches = re.findall(sri_pattern, content)
    
    for url, expected_hash in matches:
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content_hash = hashlib.sha384(response.content).digest()
            content_b64 = content_hash.encode('base64').decode().strip()
            actual_hash = f"sha384-{content_b64}"
            
            if actual_hash == expected_hash:
                print(f"✅ {url}: SRI válido")
            else:
                print(f"❌ {url}: SRI inválido")
                print(f"   Esperado: {expected_hash}")
                print(f"   Atual:    {actual_hash}")
                
        except Exception as e:
            print(f"❌ {url}: Erro na validação - {e}")

# Validar todos os templates
templates = [
    "files/interface_gerencia/templates/index.html",
    "files/app_flask/src/templates/index.html",
    "files/app_flask/src/templates/expresso.html",
    "files/app_flask/src/templates/wizard.html"
]

for template in templates:
    if Path(template).exists():
        print(f"\nValidando: {template}")
        validate_sri_in_template(template)
```

## Implementação Prática

### 1. Executar o Gerador de SRI
```bash
# Usando o script Python
python3 sri_manager.py

# Ou usando o script bash
chmod +x generate-sri.sh
./generate-sri.sh
```

### 2. Atualizar Templates
Os scripts acima irão automaticamente:
- Gerar hashes SRI para todas as CDNs
- Atualizar os templates com os hashes corretos
- Adicionar `crossorigin="anonymous"` onde necessário

### 3. Validar Implementação
```bash
python3 validate_sri.py
```

### 4. Testar no Navegador
- Abrir DevTools → Network
- Verificar se os recursos carregam sem erros
- Confirmar que não há mensagens de SRI no console

## Monitoramento Contínuo

### 1. CI/CD Integration
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
        run: python3 validate_sri.py
```

### 2. Alertas de Mudança
```python
# sri_monitor.py
import requests
import hashlib
import json
from datetime import datetime

class SRIMonitor:
    def __init__(self, config_file="sri_config.json"):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
    
    def check_for_updates(self):
        """Verifica se há atualizações nos recursos CDN"""
        for resource in self.config['resources']:
            url = resource['url']
            current_hash = resource['current_sri']
            
            try:
                response = requests.get(url, timeout=30)
                new_hash = hashlib.sha384(response.content).digest()
                new_sri = f"sha384-{new_hash.encode('base64').decode().strip()}"
                
                if new_sri != current_hash:
                    print(f"⚠️  ALERTA: {url} mudou!")
                    print(f"   Hash atual: {current_hash}")
                    print(f"   Novo hash:  {new_sri}")
                    
            except Exception as e:
                print(f"❌ Erro ao verificar {url}: {e}")

if __name__ == "__main__":
    monitor = SRIMonitor()
    monitor.check_for_updates()
```

## Benefícios da Implementação

### 1. Segurança
- **Proteção contra supply chain attacks**
- **Verificação de integridade automática**
- **Prevenção de cache poisoning**

### 2. Conformidade
- **OWASP Top 10 compliance**
- **Padrões de segurança web**
- **Auditoria de segurança**

### 3. Confiabilidade
- **Detecção de mudanças não autorizadas**
- **Validação contínua de recursos**
- **Alertas automáticos**

## Considerações Importantes

### 1. Versionamento
- **Sempre especificar versões exatas** nas URLs
- **Evitar "latest" ou versões sem especificação**
- **Documentar mudanças de versão**

### 2. Fallbacks
```html
<!-- Implementar fallbacks para CDNs -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" 
        integrity="sha384-EXAMPLED_HASH_HERE" 
        crossorigin="anonymous"
        onerror="this.onerror=null;this.src='../static/js/bootstrap.bundle.min.js'"></script>
```

### 3. Performance
- **SRI adiciona ~100 bytes por recurso**
- **Verificação é feita pelo navegador**
- **Impacto mínimo na performance**

## Conclusão

A implementação de SRI é uma medida de segurança essencial para projetos que utilizam CDNs externas. Este guia fornece todas as ferramentas necessárias para:

1. **Implementar SRI** em todos os recursos CDN
2. **Automatizar** a geração e atualização de hashes
3. **Validar** a integridade dos recursos
4. **Monitorar** mudanças continuamente

A implementação protege contra vulnerabilidades de supply chain e garante que apenas recursos autênticos sejam carregados pela aplicação.
