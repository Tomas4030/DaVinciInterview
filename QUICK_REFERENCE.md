# 🎯 QUICK REFERENCE CARD

## 👤 Admin Credentials

```
Email:    admin@davincinterviews.com
Password: DaVinci@2026Secure!
```

**Login URL:** `http://localhost:3000/admin/login`

---

## 📋 Checklist Rápido

- [ ] Executa a migração SQL (copiar/colar em Supabase SQL Editor)
- [ ] Faz `npm run dev`
- [ ] Testa homepage → Ver vagas
- [ ] Testa candidatura → Email + Telemóvel
- [ ] Testa admin login → Criar vaga
- [ ] Verifica se candidaturas são bloqueadas em caso de duplicata

---

## 🔑 Credenciais de Teste

### Email Válido

```
user@example.com
test@davincinterviews.com
```

### Telemóvel Válido (Portugal)

```
91 234 5678
+351 91 234 5678
912345678
+351912345678
```

### Telemóvel Inválido

```
123456789        ❌
abc@example.com  ❌
 ""              ❌
```

---

## 📊 APIs Principais

| Verb   | Caminho                        | Descrição                    |
| ------ | ------------------------------ | ---------------------------- |
| `GET`  | `/api/vagas`                   | Lista todas vagas (Mock API) |
| `POST` | `/api/auth/login-admin`        | Login admin                  |
| `POST` | `/api/candidatos/check`        | Verifica duplicata           |
| `POST` | `/api/candidatos/verify-email` | Envia email verificação      |
| `POST` | `/api/candidatos/create`       | Cria candidatura             |

---

## 🗂️ Ficheiros Importantes

```
data/vagas.json                     ← Vagas e perguntas
lib/admin-auth.ts                   ← Credenciais admin (mudar!)
lib/validation.ts                   ← Validações
components/home/CandidateInfoForm   ← Formulário contacto
components/EntrevistaContainer      ← Fluxo candidatura
supabase/schema.sql                 ← Migração (executar!)
```

---

## 🚀 Comandos Úteis

```bash
# Iniciar dev
npm run dev

# Build
npm run build

# Lint
npm run lint

# Limpar cache
rm -r .next node_modules
npm install
npm run dev
```

---

## ⚠️ Antes de Deploy

1. Muda credenciais admin em `lib/admin-auth.ts`
2. Atualiza `NEXT_PUBLIC_APP_URL` em `.env.local`
3. Executa migração SQL em Supabase
4. Testa todo o fluxo em staging
5. Configura email de verificação em Supabase

---

## 📞 Ficheiros Documentação

- **IMPLEMENTATION_SUMMARY.md** ← Começa aqui!
- **SETUP_GUIDE.md** ← Detalhes técnicos
- **PROJECT_STRUCTURE.md** ← Arquitetura
- **IMPLEMENTATION_CHECKLIST.md** ← Tarefas pendentes

---

**Última atualização:** 7 de Abril de 2026
