#!/bin/bash

# Script para gerar hashes SRI para todas as CDNs do projeto
# Uso: ./generate-sri.sh

echo "🔐 Gerando hashes SRI para recursos CDN..."
echo "=========================================="

generate_sri() {
    local url="$1"
    local name="$2"
    
    echo "📦 Processando: $name"
    echo "   URL: $url"
    
    # Baixa o recurso e gera o hash SHA-384
    local hash=$(curl -s "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
    local sri="sha384-$hash"
    
    echo "   SRI: $sri"
    echo ""
    
    # Retorna o hash para uso em outros scripts
    echo "$sri"
}

echo "1. Bootstrap 5.3.0 CSS (Interface de Gerenciamento)"
BOOTSTRAP_530_CSS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" "Bootstrap 5.3.0 CSS")

echo "2. Bootstrap 5.3.0 JS (Interface de Gerenciamento)"
BOOTSTRAP_530_JS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" "Bootstrap 5.3.0 JS")

echo "3. Chart.js (Interface de Gerenciamento)"
CHART_JS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/chart.js" "Chart.js")

echo "4. Bootstrap 5.3.3 CSS (App Flask)"
BOOTSTRAP_533_CSS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" "Bootstrap 5.3.3 CSS")

echo "5. Bootstrap 5.3.3 JS (App Flask)"
BOOTSTRAP_533_JS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" "Bootstrap 5.3.3 JS")

echo "6. Bootstrap Icons 1.11.3 (App Flask)"
BOOTSTRAP_ICONS_SRI=$(generate_sri "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" "Bootstrap Icons")

echo "✅ Todos os hashes SRI foram gerados!"
echo ""
echo "📋 Resumo dos Hashes:"
echo "====================="
echo "Bootstrap 5.3.0 CSS: $BOOTSTRAP_530_CSS_SRI"
echo "Bootstrap 5.3.0 JS:  $BOOTSTRAP_530_JS_SRI"
echo "Chart.js:            $CHART_JS_SRI"
echo "Bootstrap 5.3.3 CSS: $BOOTSTRAP_533_CSS_SRI"
echo "Bootstrap 5.3.3 JS:  $BOOTSTRAP_533_JS_SRI"
echo "Bootstrap Icons:     $BOOTSTRAP_ICONS_SRI"
echo ""

# Salva os hashes em um arquivo para uso posterior
cat > sri-hashes.txt << EOF
# Hashes SRI gerados em $(date)
BOOTSTRAP_530_CSS_SRI=$BOOTSTRAP_530_CSS_SRI
BOOTSTRAP_530_JS_SRI=$BOOTSTRAP_530_JS_SRI
CHART_JS_SRI=$CHART_JS_SRI
BOOTSTRAP_533_CSS_SRI=$BOOTSTRAP_533_CSS_SRI
BOOTSTRAP_533_JS_SRI=$BOOTSTRAP_533_JS_SRI
BOOTSTRAP_ICONS_SRI=$BOOTSTRAP_ICONS_SRI
EOF

echo "💾 Hashes salvos em: sri-hashes.txt"
echo ""
echo "🚀 Próximos passos:"
echo "1. Execute: ./apply-sri.sh para aplicar os hashes nos templates"
echo "2. Execute: ./validate-sri.sh para validar a implementação"
