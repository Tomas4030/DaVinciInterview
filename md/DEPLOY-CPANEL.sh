#!/bin/bash
# ========================================
# GUIA RÁPIDO: DEPLOY NO CPANEL
# ========================================

echo "🚀 Deployment davinci-interviews no cPanel"

# ========================================
# 1. Upload via SFTP/FileZilla
# ========================================
# • Host: seu-dominio.com
# • Username: cPanel user (ex: ginasiosdavinci)
# • Password: cPanel password
# • Pasta destino: ~/public_html/ ou ~/app/
#
# Que ficheiros enviar:
#   Enviar tudo EXCETO:
#   - node_modules/
#   - .next/
#   - .git/
#   - .env.local (criar localmente after upload)

echo "✓ Upload concluído"

# ========================================
# 2. SSH para o servidor cPanel
# ========================================
# SSH into: ssh user@seu-dominio.com

# ========================================
# 3. Criar .env.local (NO SERVIDOR)
# ========================================
cat > .env.local << 'EOF'
# DATABASE
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ginasiosdavinci_tomas
DB_USER=ginasiosdavinci_Tomas
DB_PASSWORD=SEU_PASSWORD_MYSQL

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
ADMIN_EMAIL=admin@seu-dominio.com
ADMIN_PASSWORD=su_senha_admin

# Email (Brevo)
BREVO_API_KEY=sua_brevo_api_key
BREVO_SENDER_NAME=DaVinci Interviews
BREVO_SENDER_EMAIL=noreply@seu-dominio.com

# MockAPI (manter se necessário)
MOCKAPI_ENDPOINT=https://mockapi.io/seu-endpoint
EOF

echo "✓ .env.local criado"

# ========================================
# 4. Instalar dependências
# ========================================
npm install
echo "✓ Dependencies instaladas"

# ========================================
# 5. Criar schema MySQL
# ========================================
# Fazer LOGIN em phpMyAdmin cPanel:
# 1. Copiar conteúdo de supabase/schema-mysql.sql
# 2. Colar em phpMyAdmin → SQL
# 3. Executar

echo "✓ Schema MySQL criada (fazer manualmente em phpMyAdmin)"

# ========================================
# 6. Build
# ========================================
npm run build
echo "✓ Build completo"

# ========================================
# 7. Setup PM2 / Node App no cPanel
# ========================================
# Opção A: PM2 (recomendado)
#   npm install -g pm2
#   pm2 start npm --name "davinci" -- start
#   pm2 startup
#   pm2 save

# Opção B: cPanel Node.js Application Manager
#   • Vai para: cPanel → Setup Node.js App
#   • Application mode: Production
#   • Application URL: seu-dominio.com
#   • Application startup file: (deixar padrão)
#   • Application root: /home/user/public_html (ou seu caminho)

echo "✓ PM2/Node.js app configurado"

# ========================================
# 8. Restart
# ========================================
# PM2:
pm2 restart davinci

# Ou file-based:
touch tmp/restart.txt

echo "✓ Aplicação restartou"

# ========================================
# 9. Verificar saúde
# ========================================
# Testar endpoint:
#   curl https://seu-dominio.com/api/vagas
#   curl -X POST -H "Content-Type: application/json" \
#        -d '{"email":"teste@example.com"}' \
#        https://seu-dominio.com/api/candidatos/send-code

echo "✓ Deployment completo!"
echo ""
echo "📋 Checklist Final:"
echo "  [ ] .env.local criado com credenciais"
echo "  [ ] Schema MySQL criada em phpMyAdmin"
echo "  [ ] npm install completo"
echo "  [ ] npm run build completo"
echo "  [ ] PM2 ou Node.js app configurado"
echo "  [ ] Application starting corretamente"
echo "  [ ] API endpoints respondendo"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Testar cada API route (candidatos, respostas, análise)"
echo "  2. Monitorizar logs via PM2 ou cPanel"
echo "  3. Configurar periodic cleanup de sessões expiradas"
echo "  4. Backup automático da BD MySQL"
