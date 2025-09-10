#!/bin/bash

# Script para validar hashes SRI implementados
# Uso: ./validate-sri.sh

echo "🔍 Validando implementação de SRI..."
echo "===================================="

# Função para validar um recurso
validate_resource() {
    local url="$1"
    local expected_sri="$2"
    local name="$3"
    
    echo "📦 Validando: $name"
    echo "   URL: $url"
    
    # Baixa o recurso atual
    local current_content=$(curl -s "$url")
    if [ $? -ne 0 ]; then
        echo "   ❌ Erro ao baixar recurso"
        return 1
    fi
    
    # Gera hash atual
    local current_hash=$(echo "$current_content" | openssl dgst -sha384 -binary | openssl base64 -A)
    local current_sri="sha384-$current_hash"
    
    echo "   Hash esperado: $expected_sri"
    echo "   Hash atual:    $current_sri"
    
    if [ "$current_sri" = "$expected_sri" ]; then
        echo "   ✅ SRI válido - recurso não foi alterado"
        return 0
    else
        echo "   ⚠️  SRI inválido - recurso foi alterado!"
        echo "   🔄 Execute ./generate-sri.sh para gerar novos hashes"
        return 1
    fi
}

# Carrega hashes esperados
if [ ! -f "sri-hashes.txt" ]; then
    echo "❌ Arquivo sri-hashes.txt não encontrado!"
    echo "   Execute primeiro: ./generate-sri.sh"
    exit 1
fi

source sri-hashes.txt

echo ""
echo "🔐 Validando recursos CDN..."
echo "============================"

# Contadores para relatório final
total_resources=0
valid_resources=0
invalid_resources=0

# 1. Bootstrap 5.3.0 CSS
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" "$BOOTSTRAP_530_CSS_SRI" "Bootstrap 5.3.0 CSS"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""

# 2. Bootstrap 5.3.0 JS
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" "$BOOTSTRAP_530_JS_SRI" "Bootstrap 5.3.0 JS"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""

# 3. Chart.js
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/chart.js" "$CHART_JS_SRI" "Chart.js"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""

# 4. Bootstrap 5.3.3 CSS
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" "$BOOTSTRAP_533_CSS_SRI" "Bootstrap 5.3.3 CSS"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""

# 5. Bootstrap 5.3.3 JS
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" "$BOOTSTRAP_533_JS_SRI" "Bootstrap 5.3.3 JS"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""

# 6. Bootstrap Icons
total_resources=$((total_resources + 1))
if validate_resource "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" "$BOOTSTRAP_ICONS_SRI" "Bootstrap Icons"; then
    valid_resources=$((valid_resources + 1))
else
    invalid_resources=$((invalid_resources + 1))
fi

echo ""
echo "📊 Relatório de Validação:"
echo "=========================="
echo "Total de recursos: $total_resources"
echo "Recursos válidos:  $valid_resources"
echo "Recursos inválidos: $invalid_resources"

if [ $invalid_resources -eq 0 ]; then
    echo ""
    echo "🎉 Todos os recursos estão válidos!"
    echo "✅ Implementação de SRI funcionando corretamente"
else
    echo ""
    echo "⚠️  Alguns recursos precisam de atualização"
    echo "🔄 Execute os seguintes comandos:"
    echo "   1. ./generate-sri.sh  # Gerar novos hashes"
    echo "   2. ./apply-sri.sh     # Aplicar novos hashes"
    echo "   3. ./validate-sri.sh  # Validar novamente"
fi

echo ""
echo "🔍 Verificando implementação nos templates..."

# Função para verificar se SRI está implementado em um arquivo
check_template_sri() {
    local file="$1"
    local resource_name="$2"
    
    if [ ! -f "$file" ]; then
        echo "   ⚠️  Arquivo não encontrado: $file"
        return
    fi
    
    if grep -q "integrity=" "$file"; then
        echo "   ✅ $file: SRI implementado ($resource_name)"
    else
        echo "   ❌ $file: SRI NÃO implementado ($resource_name)"
    fi
}

echo ""
echo "📋 Verificação de Templates:"
echo "============================"

check_template_sri "files/interface_gerencia/templates/index.html" "Bootstrap 5.3.0 + Chart.js"
check_template_sri "files/app_flask/src/templates/index.html" "Bootstrap 5.3.3"
check_template_sri "files/app_flask/src/templates/expresso.html" "Bootstrap 5.3.3 + Icons"
check_template_sri "files/app_flask/src/templates/wizard.html" "Bootstrap 5.3.3 + Icons"

echo ""
echo "🏁 Validação concluída!"
echo ""
echo "💡 Dicas para teste manual:"
echo "1. Abra a aplicação no navegador"
echo "2. Abra DevTools (F12) → Network"
echo "3. Recarregue a página"
echo "4. Verifique se não há erros de SRI no console"
echo "5. Todos os recursos CDN devem carregar com status 200"
