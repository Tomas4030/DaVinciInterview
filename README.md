# DaVinci Interviews

Plataforma de entrevistas em formato chatbot, construída com **Next.js 14**, **Tailwind CSS** e **Supabase**.

---

## Stack

| Camada        | Tecnologia                              |
|---------------|-----------------------------------------|
| Frontend      | Next.js 14 (App Router) + TypeScript    |
| Estilos       | Tailwind CSS + CSS custom properties    |
| Base de dados | Supabase (PostgreSQL)                   |
| Autenticação  | Supabase Auth (apenas área admin)       |
| API interna   | Next.js Route Handlers (`/app/api/`)    |

> **Nota:** a versão anterior dependia de um backend FastAPI separado.  
> Esta versão é **full-stack no Next.js** — sem servidor Python necessário.

---

## Estrutura do projeto

```
davinci-interviews/
├── supabase/
│   └── schema.sql              ← Script SQL completo (tabelas + RLS + seed)
└── frontend/
    ├── app/
    │   ├── page.tsx            ← Homepage: lista de vagas
    │   ├── entrevista/
    │   │   └── [vagaId]/
    │   │       └── page.tsx    ← Página da entrevista
    │   ├── admin/
    │   │   ├── layout.tsx      ← Guard de autenticação
    │   │   ├── page.tsx        ← Dashboard admin
    │   │   ├── login/page.tsx
    │   │   ├── entrevistas/
    │   │   │   ├── nova/page.tsx
    │   │   │   └── [vagaId]/page.tsx
    │   │   └── respostas/page.tsx  ← Visualizador de candidaturas
    │   └── api/
    │       ├── vagas/route.ts          ← GET (lista) + POST (criar)
    │       ├── vagas/[vagaId]/route.ts ← GET + PUT + DELETE
    │       └── respostas/route.ts      ← POST (guardar resposta)
    ├── components/
    │   ├── chat/
    │   │   └── ChatEntrevista.tsx  ← Interface conversacional
    │   └── admin/
    │       ├── AdminNav.tsx
    │       ├── LoginForm.tsx
    │       └── EntrevistaForm.tsx
    └── lib/
        ├── supabase.ts         ← Clientes Supabase (server + client)
        ├── api.ts              ← Funções de acesso a dados
        └── database.types.ts  ← Tipos TypeScript do schema
```

---

## Configuração rápida

### 1. Supabase

1. Cria um projeto em [supabase.com](https://supabase.com)
2. Vai ao **SQL Editor** e corre o conteúdo de `supabase/schema.sql`
3. Copia o **Project URL** e a **anon key** (em *Settings → API*)
4. Para o login de admin, cria um utilizador em *Authentication → Users*

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

---

## Funcionalidades

### Área pública (candidatos)
- **`/`** — Lista de vagas ativas com modalidade, duração e número de perguntas
- **`/entrevista/[vagaId]`** — Entrevista conversacional com barra de progresso
- Respostas guardadas automaticamente no Supabase após cada resposta
- Sem necessidade de conta ou autenticação

### Área admin (`/admin`)
- Protegida por Supabase Auth (email + password)
- **Dashboard** com estatísticas: entrevistas, perguntas, respostas
- **Criar/editar/apagar** entrevistas com perguntas reordenáveis
- **Visualizador de respostas** por vaga, agrupado por sessão
- Toggle para activar/desactivar vagas sem as apagar

---

## Modelo de dados (Supabase)

### Tabela `vagas`

| Campo         | Tipo        | Descrição                             |
|---------------|-------------|---------------------------------------|
| `id`          | `text` (PK) | Slug único, ex: `fullstack-senior`    |
| `titulo`      | `text`      | Nome da vaga                          |
| `descricao`   | `text`      | Descrição curta (opcional)            |
| `modalidade`  | `text`      | `Remoto` · `Híbrido` · `Presencial`  |
| `duracao_min` | `integer`   | Duração estimada em minutos           |
| `perguntas`   | `jsonb`     | Array de `{id, texto, tipo}`          |
| `ativa`       | `boolean`   | Visível para candidatos?              |
| `criada_em`   | `timestamptz` | Timestamp automático               |

### Tabela `respostas`

| Campo         | Tipo        | Descrição                             |
|---------------|-------------|---------------------------------------|
| `id`          | `uuid` (PK) | Auto-gerado                           |
| `sessao_id`   | `uuid`      | Agrupa respostas do mesmo candidato   |
| `vaga_id`     | `text` (FK) | Referência à vaga                     |
| `pergunta_id` | `integer`   | ID da pergunta no JSONB               |
| `resposta`    | `text`      | Resposta do candidato                 |
| `criada_em`   | `timestamptz` | Timestamp automático               |

### Row Level Security (RLS)

- **Vagas**: leitura pública, escrita apenas autenticados
- **Respostas**: inserção pública, leitura apenas autenticados

---

## Expandir o projeto

### Adicionar uma nova vaga
No dashboard admin → "Nova entrevista" → preenche o formulário.  
Ou directamente via SQL / Supabase Studio.

### Adicionar campos às perguntas
Edita o tipo `Pergunta` em `lib/database.types.ts` e o formulário em `EntrevistaForm.tsx`.

### Exportar respostas para CSV
Adiciona uma route em `/app/api/admin/export/route.ts` que faz `supabase.from('respostas').select(...)` e retorna CSV.

### Notificações por email
Usa [Supabase Edge Functions](https://supabase.com/docs/guides/functions) com Resend ou SendGrid para notificar o admin quando chegar uma nova candidatura.

### Deploy
Recomendado: **Vercel** (integração nativa com Next.js).  
1. Conecta o repositório ao Vercel
2. Define as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Deploy automático a cada push
