# FASE 0 — Auditoria e Preparação (executada)

Data: 2026-04-20

## 1) Estrutura atual do projeto e base de dados

### Estado real encontrado
- A app runtime está ligada a **MySQL** (`lib/db.ts`), não a Supabase/Postgres.
- Existem dois esquemas SQL no repositório:
  - `supabase/schema.sql` (Postgres + RLS apenas para `candidato_respostas`)
  - `supabase/schema-mysql.sql` (schema principal usado pelo código atual)

### Tabelas atuais (schema MySQL)
- `vagas`
- `candidato_respostas`
- `verification_codes`
- `candidato_entrevista_sessions`
- `sessoes_entrevista`
- `candidato_respostas_v2`
- `interview_logs`
- `analises_entrevista`

### Relações atuais (principais)
- `candidato_respostas.vaga_id -> vagas.id` (lógica no código; sem FK explícita em `schema-mysql.sql`)
- `candidato_respostas_v2.sessao_id -> sessoes_entrevista.id` (FK)
- `interview_logs.sessao_id -> sessoes_entrevista.id` (FK)
- `analises_entrevista.sessao_id -> sessoes_entrevista.id` (FK)

### Gap crítico para SaaS multi-empresa
- Não existem ainda tabelas `companies`, `company_members`, `interviews` multi-tenant.
- Não existe `company_id` nas tabelas operacionais principais.

## 2) Rotas Next.js atuais (mapeamento)

### Páginas
- Públicas:
  - `/` (`app/page.tsx`)
  - `/entrevista/[vagaId]` (`app/entrevista/[vagaId]/page.tsx`)
  - `/admin/login` (`app/admin/login/page.tsx`)
- Admin protegido (layout atual):
  - `/admin`
  - `/admin/entrevistas/nova`
  - `/admin/entrevistas/[vagaId]`
  - `/admin/dashboard/[vagaId]`
  - `/admin/leaderboard/[vagaId]`
  - `/admin/respostas`

### APIs
- Auth/Admin:
  - `/api/auth/login-admin`
  - `/api/auth/logout-admin`
- Vagas:
  - `/api/vagas`
  - `/api/vagas/[vagaId]`
- Candidatos/verificação:
  - `/api/candidatos/check`
  - `/api/candidatos/send-code`
  - `/api/candidatos/verify-code`
  - `/api/candidatos/verify-session`
  - `/api/candidatos/verify-email`
  - `/api/candidatos/create`
- Respostas/analise:
  - `/api/candidato-respostas`
  - `/api/candidato-respostas/[sessaoId]`
  - `/api/candidato-respostas/delete-by-email`
  - `/api/candidato-respostas-v2`
  - `/api/candidato-respostas-v2/[sessaoId]`
  - `/api/respostas`
  - `/api/analise/gerar-resumo`
  - `/api/analise/comparar-candidatos`
  - `/api/entrevista/next-question`
  - `/api/exportar/pdf`
- Exemplo seguro:
  - `/api/secure-example`

### Rotas que precisam de adaptação para multi-empresa
- Toda a árvore `/admin/*` deve migrar para `/admin/[slug]/*`.
- Fluxo candidato deve migrar de `/entrevista/[vagaId]` para `/{slug}/interview/{interviewId}`.
- APIs de admin devem validar associação user -> company (via slug/company_id).
- APIs de dados devem exigir filtro por `company_id`.

## 3) Hard-coded single-company encontrados

### Branding e naming fixo
- `app/layout.tsx:5` -> `Chat2Work` / `DaVinci`
- referências `davinci-interviews`, `DaVinci Interview` em docs

### Auth de admin single-tenant (crítico)
- `lib/admin-auth.ts` usa `ADMIN_EMAIL` + `ADMIN_PASSWORD` globais
- token é apenas Base64 simples (não assinado)
- sem noção de `company_id`, `role` por empresa, ou memberships

### Routing fixo de admin
- links e push hard-coded para `/admin` em:
  - `components/admin/AdminNav.tsx`
  - `components/admin/EntrevistaForm.tsx`
  - `components/admin/LoginForm.tsx`
  - páginas em `app/admin/(protected)/*`

### Queries sem isolamento multi-tenant
- `lib/queries/*` filtra por `vaga_id`, `email`, etc., mas sem `company_id`.

## 4) Fluxo atual de autenticação e permissões

### Fluxo de login atual
1. Frontend envia credenciais para `/api/auth/login-admin`.
2. Backend valida contra variáveis de ambiente globais (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
3. Cria token Base64 com `{ email, role: 'admin', iat }`.
4. Guarda cookie HTTP-only `davinci_admin_session`.
5. `app/admin/(protected)/layout.tsx` lê cookie e faz `parseAdminToken`.

### Permissões atuais
- Modelo atual: apenas um "admin global".
- Não existe `owner/admin/viewer` por empresa.
- Não existe validação de slug, company membership ou RLS efetivo para MySQL.

### Risco atual
- Multi-tenant impossível com o modelo atual sem refatorar auth + DB + routing.

## 5) Estado git/tag de backup

### Resultado
- Tag `v0-single-company` ainda **não criada**.
- Motivo: worktree não está limpa:
  - `D ideias.md`
  - `?? md/`


## 6) Conclusão da FASE 0

- Auditoria funcional concluída.
- Bloqueio restante da Fase 0: criação da tag de backup com repositório limpo.
- Próxima fase técnica: **FASE 1 (Base de Dados Multi-Empresa)** com migração incremental mantendo compatibilidade com MySQL atual.
