#!/bin/bash

# Test script para validar login e features principais
# Uso: ./test-login.sh

echo "🧪 Frontend Tests - Login & Features"
echo "===================================="
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se Playwright está instalado
if [ ! -d "node_modules/@playwright" ]; then
    echo "🎭 Instalando Playwright..."
    npx playwright install
fi

echo "✅ Dependências verificadas"
echo ""

# Menu de opções
echo "Escolha um teste:"
echo "1) Login simples com CAPTCHA"
echo "2) Toda suite de testes"
echo "3) Teste de Feature Flags"
echo "4) Teste de Colaboradores"
echo "5) Dev mode (abrir navegador)"
echo ""
read -p "Opção (1-5): " option

case $option in
    1)
        echo "🔐 Rodando teste de login..."
        npx playwright test tests/e2e/login-test-simple.spec.ts --headed
        ;;
    2)
        echo "🎯 Rodando suite completa..."
        npx playwright test --headed
        ;;
    3)
        echo "🚩 Rodando testes de feature flags..."
        npx playwright test tests/e2e/configuracoes.spec.ts --headed
        ;;
    4)
        echo "👥 Rodando testes de colaboradores..."
        npx playwright test tests/e2e/colaboradores.spec.ts --headed
        ;;
    5)
        echo "🎮 Iniciando dev mode..."
        npm run dev &
        DEV_PID=$!
        sleep 3
        echo "🌐 Abrindo Playwright Inspector..."
        PWDEBUG=1 npx playwright test tests/e2e/login-test-simple.spec.ts
        kill $DEV_PID 2>/dev/null || true
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Teste finalizado!"
echo ""
echo "📝 Credenciais para testes:"
echo "   Email: admin@guimicell.com"
echo "   Senha: atoadm2026 (ou 12345678)"
