#!/bin/bash

# Script para aplicar hashes SRI nos templates HTML
# Uso: ./apply-sri.sh

echo "🔧 Aplicando hashes SRI nos templates..."
echo "========================================"

# Verifica se o arquivo de hashes existe
if [ ! -f "sri-hashes.txt" ]; then
    echo "❌ Arquivo sri-hashes.txt não encontrado!"
    echo "   Execute primeiro: ./generate-sri.sh"
    exit 1
fi

# Carrega os hashes
source sri-hashes.txt

echo "📁 Processando templates..."

# Função para aplicar SRI em um arquivo
apply_sri_to_file() {
    local file="$1"
    local url="$2"
    local sri="$3"
    local resource_type="$4"  # "css" ou "js"
    
    if [ ! -f "$file" ]; then
        echo "⚠️  Arquivo não encontrado: $file"
        return
    fi
    
    echo "   📝 Atualizando: $file"
    
    if [ "$resource_type" = "css" ]; then
        # Para CSS (link)
        sed -i "s|href=\"$url\"|href=\"$url\" integrity=\"$sri\" crossorigin=\"anonymous\"|g" "$file"
    else
        # Para JS (script)
        sed -i "s|src=\"$url\"|src=\"$url\" integrity=\"$sri\" crossorigin=\"anonymous\"|g" "$file"
    fi
    
    echo "   ✅ SRI aplicado para $url"
}

# 1. Interface de Gerenciamento
echo ""
echo "1. Interface de Gerenciamento (files/interface_gerencia/templates/index.html)"
apply_sri_to_file "files/interface_gerencia/templates/index.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" \
                  "$BOOTSTRAP_530_CSS_SRI" "css"

apply_sri_to_file "files/interface_gerencia/templates/index.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" \
                  "$BOOTSTRAP_530_JS_SRI" "js"

apply_sri_to_file "files/interface_gerencia/templates/index.html" \
                  "https://cdn.jsdelivr.net/npm/chart.js" \
                  "$CHART_JS_SRI" "js"

# 2. App Flask - index.html
echo ""
echo "2. App Flask - index.html (files/app_flask/src/templates/index.html)"
apply_sri_to_file "files/app_flask/src/templates/index.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" \
                  "$BOOTSTRAP_533_CSS_SRI" "css"

apply_sri_to_file "files/app_flask/src/templates/index.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" \
                  "$BOOTSTRAP_533_JS_SRI" "js"

# 3. App Flask - expresso.html
echo ""
echo "3. App Flask - expresso.html (files/app_flask/src/templates/expresso.html)"
apply_sri_to_file "files/app_flask/src/templates/expresso.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" \
                  "$BOOTSTRAP_533_CSS_SRI" "css"

apply_sri_to_file "files/app_flask/src/templates/expresso.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" \
                  "$BOOTSTRAP_ICONS_SRI" "css"

apply_sri_to_file "files/app_flask/src/templates/expresso.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" \
                  "$BOOTSTRAP_533_JS_SRI" "js"

# 4. App Flask - wizard.html
echo ""
echo "4. App Flask - wizard.html (files/app_flask/src/templates/wizard.html)"
apply_sri_to_file "files/app_flask/src/templates/wizard.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" \
                  "$BOOTSTRAP_533_CSS_SRI" "css"

apply_sri_to_file "files/app_flask/src/templates/wizard.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" \
                  "$BOOTSTRAP_ICONS_SRI" "css"

apply_sri_to_file "files/app_flask/src/templates/wizard.html" \
                  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" \
                  "$BOOTSTRAP_533_JS_SRI" "js"

echo ""
echo "✅ SRI aplicado em todos os templates!"
echo ""
echo "🔍 Verificando implementação..."

# Verifica se os hashes foram aplicados corretamente
check_sri_implementation() {
    local file="$1"
    local url="$2"
    
    if grep -q "integrity=" "$file" && grep -q "$url" "$file"; then
        echo "   ✅ $file: SRI implementado para $url"
    else
        echo "   ❌ $file: SRI NÃO implementado para $url"
    fi
}

echo ""
echo "📋 Verificação de Implementação:"
echo "================================"

# Verifica cada template
check_sri_implementation "files/interface_gerencia/templates/index.html" "bootstrap@5.3.0"
check_sri_implementation "files/interface_gerencia/templates/index.html" "chart.js"
check_sri_implementation "files/app_flask/src/templates/index.html" "bootstrap@5.3.3"
check_sri_implementation "files/app_flask/src/templates/expresso.html" "bootstrap@5.3.3"
check_sri_implementation "files/app_flask/src/templates/expresso.html" "bootstrap-icons"
check_sri_implementation "files/app_flask/src/templates/wizard.html" "bootstrap@5.3.3"
check_sri_implementation "files/app_flask/src/templates/wizard.html" "bootstrap-icons"

echo ""
echo "🎉 Implementação de SRI concluída!"
echo ""
echo "🚀 Próximos passos:"
echo "1. Execute: ./validate-sri.sh para validar os hashes"
echo "2. Teste a aplicação no navegador"
echo "3. Verifique o console do DevTools para erros de SRI"
