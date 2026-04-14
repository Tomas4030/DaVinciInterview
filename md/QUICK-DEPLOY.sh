#!/bin/bash
# 🚀 QUICK START: DEPLOYMENT CHECKLIST (Copiar/colar)

# ==================================================
# ✅ ANTES DE COMEÇAR
# ==================================================

echo "📋 PRÉ-REQUISITOS:"
echo "  [ ] Ter acesso SSH ao cPanel (user@seu-dominio.com)"
echo "  [ ] Ter credenciais MySQL do cPanel"
echo "  [ ] Ter FileZilla (ou similar) para SFTP"
echo "  [ ] Ter phpMyAdmin acesso"
echo ""
echo "✨ TUDO OK? Continua..."
read -p "Pressione ENTER para começar..."

# ==================================================
# PASSO 1: UPLOAD (via FileZilla)
# ==================================================

echo ""
echo "1️⃣  UPLOAD (30 minutos)"
echo "  Host: seu-dominio.com"
echo "  User: seu_cpanel_user"
echo "  Pass: sua_cpanel_password"
echo "  Dir:  /home/seu_user/public_html"
echo ""
echo "  ⚠️  NÃO ENVIAR:"
echo "    - node_modules/"
echo "    - .next/"
echo "    - .git/"
echo ""
echo "  ✅ ENVIAR:"
echo "    - Tudo excepto as pastas acima"
echo ""
read -p "Upload completo? Pressione ENTER..."

# ==================================================
# PASSO 2: SSH (30 segundos)
# ==================================================

echo ""
echo "2️⃣  SSH"
echo "  ssh seu_user@seu-dominio.com"
echo "  (Colar nos seus terminais)"
echo ""
read -p "Ligado via SSH? Pressione ENTER..."

# ==================================================
# PASSO 3: CRIAR .env.local (1 minuto)
# ==================================================

ssh_commands=$(cat << 'SSH_EOF'

cd ~/public_html

cat > .env.local << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ginasiosdavinci_tomas
DB_USER=ginasiosdavinci_Tomas
DB_PASSWORD=SUA_SENHA_MYSQL_AQUI

NEXT_PUBLIC_APP_URL=https://seu-dominio.com
ADMIN_EMAIL=admin@seu-dominio.com
ADMIN_PASSWORD=sua_senha_admin

BREVO_API_KEY=sua_chave_brevo
BREVO_SENDER_NAME=DaVinci Interviews
BREVO_SENDER_EMAIL=noreply@seu-dominio.com
EOF

echo "✅ .env.local criado"
SSH_EOF
)

echo ""
echo "3️⃣  CRIAR .env.local"
echo "  Execute isto via SSH:"
echo ""
echo "$ssh_commands"
echo ""
read -p "Criado? Pressione ENTER..."

# ==================================================
# PASSO 4: DEPENDÊNCIAS (5 minutos)
# ==================================================

echo ""
echo "4️⃣  npm install"
echo "  $ npm install"
echo ""
read -p "Instalado? Pressione ENTER..."

# ==================================================
# PASSO 5: SCHEMA MYSQL (2 minutos)
# ==================================================

echo ""
echo "5️⃣  SCHEMA MYSQL (phpMyAdmin)"
echo ""
echo "  1. Entrar em cPanel → phpMyAdmin"
echo "  2. Selecionar BD: ginasiosdavinci_tomas"
echo "  3. Ir a: SQL"
echo "  4. Copiar conteúdo de: supabase/schema-mysql.sql"
echo "  5. Colar em phpMyAdmin"
echo "  6. Clicar: Go / Execute"
echo ""
read -p "Schema criada? Pressione ENTER..."

# ==================================================
# PASSO 6: BUILD (3 minutos)
# ==================================================

echo ""
echo "6️⃣  BUILD via SSH"
echo "  $ npm run build"
echo ""
read -p "Build completo? Pressione ENTER..."

# ==================================================
# PASSO 7: NODE.JS APP (2 minutos)
# ==================================================

echo ""
echo "7️⃣  Setup Node.js Application (cPanel)"
echo ""
echo "  1. cPanel → Setup Node.js App"
echo "  2. Clicar: Create Application"
echo "  3. Preencher:"
echo "     - Application mode: Production"
echo "     - Application URL: seu-dominio.com"
echo "     - Application root: /home/seu_user/public_html"
echo "  4. Clicar: Create"
echo ""
read -p "App Node.js criada no cPanel? Pressione ENTER..."

# ==================================================
# PASSO 8: RESTART (30 segundos)
# ==================================================

echo ""
echo "8️⃣  RESTART"
echo ""
echo "  Opção A (cPanel):"
echo "    - Ir a: cPanel → Node.js Applications"
echo "    - Encontrar app"
echo "    - Clicar: Restart"
echo ""
echo "  Opção B (SSH):"
echo "    $ touch tmp/restart.txt"
echo ""
read -p "App restartou? Pressione ENTER..."

# ==================================================
# PASSO 9: TESTES (5 minutos)
# ==================================================

echo ""
echo "9️⃣  TESTES"
echo ""
echo "  Teste 1 - Check BD:"
echo "    curl https://seu-dominio.com/api/vagas"
echo ""
echo "  Teste 2 - Enviar Code:"
echo "    curl -X POST https://seu-dominio.com/api/candidatos/send-code \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"email\":\"teste@example.com\",\"telefone\":\"+351912345678\",\"vaga_id\":\"vaga-001\"}'"
echo ""
echo "  Teste 3 - Verificar:"
echo "    curl -X POST https://seu-dominio.com/api/candidatos/check \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"email\":\"teste@example.com\",\"telefone\":\"+351912345678\",\"vaga_id\":\"vaga-001\"}'"
echo ""
read -p "Testes passaram? Pressione ENTER..."

# ==================================================
# FINAL
# ==================================================

echo ""
echo "🎉 DEPLOYMENT COMPLETO!"
echo ""
echo "✅ Próximos passos:"
echo "  1. Monitorizar /api (primeiras 24h)"
echo "  2. Verificar logs (cPanel → Node.js Applications → Logs)"
echo "  3. Testar fluxo completo de candidatura"
echo ""
echo "📞 Se houver problemas:"
echo "  1. Ver logs: cPanel → Node.js Applications → Logs Output"
echo "  2. Verificar mysql: mysql -u ginasiosdavinci_Tomas ginasiosdavinci_tomas"
echo "  3. Restart app: toque em tmp/restart.txt"
echo ""

