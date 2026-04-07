# Estrutura de Ficheiros — DaVinci Interviews

## 📁 Raiz do Projeto

```
davinci-interviews/
├── app/                           # Next.js App Router
│   ├── admin/
│   │   ├── login/                # ✨ Login do admin
│   │   │   └── page.tsx
│   │   ├── (protected)/          # Páginas protegidas
│   │   │   ├── entrevistas/
│   │   │   ├── respostas/
│   │   │   └── layout.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── login-admin/      # ✨ Nova: Autenticação admin
│   │   │       └── route.ts
│   │   ├── candidatos/
│   │   │   ├── check/            # ✨ Nova: Verifica duplicatas
│   │   │   ├── create/           # ✨ Nova: Cria candidatura
│   │   │   └── verify-email/     # ✨ Nova: Verifica email
│   │   ├── respostas/
│   │   └── vagas/
│   │       └── route.ts          # 🔄 Atualizado: Mock API
│   ├── entrevista/
│   │   └── [vagaId]/
│   │       └── page.tsx          # 🔄 Atualizado: Usa novo container
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
│
├── components/
│   ├── home/
│   │   ├── CandidateInfoForm.tsx  # ✨ Nova: Formulário de contacto
│   │   ├── Config.ts             # 🔄 Atualizado: Tipos melhorados
│   │   ├── EmptyState.tsx
│   │   ├── Footer.tsx
│   │   ├── GridPattern.tsx
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── Icons.tsx
│   │   ├── VagaCard.tsx
│   │   ├── VagasSection.tsx
│   │   └── index.ts
│   ├── admin/
│   │   ├── LoginForm.tsx         # 🔄 Atualizado: Nova autenticação
│   │   ├── AdminNav.tsx
│   │   ├── EntrevistaForm.tsx
│   │   └── LoginForm.tsx
│   ├── chat/
│   │   └── ChatEntrevista.tsx     # 🔄 Atualizado: Guarda candidatura
│   ├── EntrevistaContainer.tsx     # ✨ Nova: Wrapper com formulário
│   └── ClearLegacyServiceWorker.tsx
│
├── data/
│   └── vagas.json                 # ✨ Nova: Mock API data
│
├── lib/
│   ├── admin-auth.ts              # ✨ Nova: Autenticação admin
│   ├── api.ts                     # 🔄 Atualizado: Usa Mock API
│   ├── database.types.ts
│   ├── mock-api.ts                # ✨ Nova: Interface para Mock API
│   ├── supabase-server.ts
│   ├── supabase.ts
│   └── validation.ts              # ✨ Nova: Validações
│
├── supabase/
│   └── schema.sql                 # 🔄 Atualizado: Tabela candidacies
│
├── public/
│   └── sw.js
│
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.js
├── .env.local                     # Mantém o mesmo
├── SETUP_GUIDE.md                 # ✨ Nova: Guia completo
├── IMPLEMENTATION_CHECKLIST.md    # ✨ Nova: Checklist
└── PROJECT_STRUCTURE.md           # Este ficheiro

```

---

## 🆕 Ficheiros Novos

| Ficheiro                                   | Descrição                            |
| ------------------------------------------ | ------------------------------------ |
| `data/vagas.json`                          | Mock API com vagas e perguntas       |
| `lib/admin-auth.ts`                        | Lógica de autenticação do admin      |
| `lib/mock-api.ts`                          | Funções para aceder à Mock API       |
| `lib/validation.ts`                        | Validações de email e telefone       |
| `components/home/CandidateInfoForm.tsx`    | Formulário de recolha de contacto    |
| `components/EntrevistaContainer.tsx`       | Wrapper com fluxo de Form → Chat     |
| `app/api/auth/login-admin/route.ts`        | Endpoint de login admin              |
| `app/api/candidatos/check/route.ts`        | Endpoint de verificação de duplicata |
| `app/api/candidatos/create/route.ts`       | Endpoint de criação de candidatura   |
| `app/api/candidatos/verify-email/route.ts` | Endpoint de verificação de email     |
| `SETUP_GUIDE.md`                           | Documentação completa                |
| `IMPLEMENTATION_CHECKLIST.md`              | Checklist de implementação           |
| `PROJECT_STRUCTURE.md`                     | Este ficheiro                        |

---

## 🔄 Ficheiros Atualizados

| Ficheiro                             | O que mudou                                               |
| ------------------------------------ | --------------------------------------------------------- |
| `lib/api.ts`                         | `listarVagasAtivas()` e `obterVaga()` agora usam Mock API |
| `app/api/vagas/route.ts`             | Implementado com Mock API em vez de Supabase              |
| `app/entrevista/[vagaId]/page.tsx`   | Usa novo `EntrevistaContainer`                            |
| `components/chat/ChatEntrevista.tsx` | Adiciona props para email/phone e guarda candidatura      |
| `components/admin/LoginForm.tsx`     | Usa nova autenticação admin                               |
| `supabase/schema.sql`                | Adiciona tabela `candidacies`                             |
| `components/home/config.ts`          | Tipos melhorados                                          |

---

## 📊 Fluxos de Dados

### Fluxo de Candidatura

```
Homepage
   ↓
listarVagasAtivas() → GET /api/vagas (Mock API)
   ↓
Clica em "Iniciar"
   ↓
EntrevistaContainer (Render condicional)
   ├─ Sem candidateInfo
   │  └─ CandidateInfoForm
   │     ├─ Validação (email, phone)
   │     ├─ POST /api/candidatos/check (Verifica duplicata)
   │     │  └─ Se existe: Mostra aviso
   │     │  └─ Se novo: Envia email
   │     └─ POST /api/candidatos/verify-email (Supabase)
   │
   └─ Com candidateInfo
      └─ ChatEntrevista
         ├─ Mostra perguntas
         ├─ POST /api/respostas (Guarda cada resposta)
         └─ Ao terminar: POST /api/candidatos/create
            └─ Cria registo em candidacies (Supabase)
```

### Fluxo Admin

```
/admin/login
   ↓
LoginForm
   ↓
POST /api/auth/login-admin
   ├─ Verifica credenciais
   └─ Retorna token (base64)
      ↓
   Guarda em localStorage
      ↓
   /admin (Página protegida)
      ├─ Cria novas vagas
      │  └─ POST /api/vagas (Mock API)
      └─ Vê candidaturas
         └─ GET /supabase candidacies
```

---

## 🔐 Base de Dados

### Supabase (antes)

- `vagas` — Informações das vagas
- `respostas` — Respostas dos candidatos

### Supabase (depois)

- `vagas` — ~~Removida~~ (agora em Mock API)
- `respostas` — Respostas dos candidatos
- `candidacies` — **NOVA** Rastreamento de candidaturas

---

## 🎯 Próximas Adições

Recomendado para futuro:

1. **Dashboard admin com gráficos**
   - Componentes em `components/admin/`
   - Queries em `lib/`

2. **Exportação de dados**
   - CSV, PDF das candidaturas
   - API routes em `app/api/export/`

3. **Notificações automáticas**
   - Email ao candidato após candidatura
   - Email ao admin de nova candidatura

4. **Video interviews**
   - Integração com Twilio ou similar
   - Recording e playback

---

Generated: 7 de Abril de 2026
