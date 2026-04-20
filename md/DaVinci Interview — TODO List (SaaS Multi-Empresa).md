# DaVinci Interview — TODO List (SaaS Multi-Empresa) - Adaptado para MySQL

**Regra:** Completa cada fase sequencialmente. Não passes à fase seguinte sem terminar a anterior. Assinala cada item com `[x]` quando terminares.

## FASE 0 — Auditoria e Preparação (Crítica e Aprofundada)
Perceber o que já existe antes de tocar em código, com foco em segurança e escalabilidade.

*   `[x]` Auditar a estrutura atual do projeto (páginas, componentes, DB schema).
*   `[x]` Mapear todas as tabelas MySQL existentes e suas relações. (Observação: `candidato_respostas` existe, mas falta uma tabela `vagas` explícita e `companies`).
*   `[x]` Listar todas as rotas Next.js existentes (App Router ou Pages) e identificar as que precisam de ser protegidas ou adaptadas para multi-empresa.
*   `[x]` Identificar hard-coded references à empresa atual (nomes, IDs, assets) e planear a sua parametrização.
*   `[x]` **Crítico:** Documentar o fluxo de autenticação atual e as permissões de acesso.

## FASE 1 — Base de Dados Multi-Empresa (Fundação Sólida)
Toda a app assenta nisto. Tem que ficar sólido antes de avançar. A segurança dos dados é primordial.

### 1.1 — Tabela `companies`
Criar tabela `companies` com os campos:
*   `[x]` `id` (`CHAR(36)`, PK, NOT NULL) – Usar `UUID()` do MySQL ou gerar UUIDs na aplicação (ex: `uuidv4` em Node.js).
*   `[x]` `name` (`VARCHAR(255)`, NOT NULL)
*   `[x]` `slug` (`VARCHAR(255)`, NOT NULL, UNIQUE) — usado na URL: `davinci.com/empresa-slug`. **Crítico:** Implementar lógica de geração de slug única e amigável.
*   `[x]` `description` (`TEXT`)
*   `[x]` `logo_url` (`VARCHAR(255)`, nullable) — URL para o logo da empresa.
*   `[x]` `primary_color` (`VARCHAR(7)`, nullable) — para branding por empresa (ex: `#RRGGBB`).
*   `[x]` `owner_id` (`CHAR(36)`, FK → `users(id)`, NOT NULL) — O utilizador que criou a empresa.
*   `[x]` `stripe_customer_id` (`VARCHAR(255)`, nullable, UNIQUE) — ID do cliente no Stripe para gestão de subscrições.
*   `[x]` `subscription_status` (`ENUM('trialing', 'active', 'past_due', 'canceled')`, NOT NULL, DEFAULT `'trialing'`)
*   `[x]` `plan` (`ENUM('basic', 'pro', 'enterprise')`, NOT NULL, DEFAULT `'basic'`)
*   `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
*   `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`) — Adicionar trigger para atualizar automaticamente.

### 1.2 — Tabela `company_members` (Gestão de Acessos)
Criar tabela `company_members`:
*   `[x]` `id` (`CHAR(36)`, PK, NOT NULL) – Usar `UUID()` do MySQL ou gerar UUIDs na aplicação.
*   `[x]` `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL)
*   `[x]` `user_id` (`CHAR(36)`, FK → `users(id)`, NOT NULL)
*   `[x]` `role` (`ENUM('owner', 'admin', 'viewer')`, NOT NULL, DEFAULT `'viewer'`)
*   `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
*   `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
*   `[x]` **Crítico:** Adicionar `UNIQUE(company_id, user_id)` para evitar duplicação de membros.

### 1.3 — Tabela `interviews` (Vagas)
Criar tabela `interviews` (se ainda não existir ou adaptar a existente `vagas`):
*   `[x]` `id` (`CHAR(36)`, PK)
*   `[x]` `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL)
*   `[x]` `title` (`VARCHAR(255)`, NOT NULL)
*   `[x]` `description` (`TEXT`)
*   `[x]` `status` (`ENUM('draft', 'published', 'archived')`, NOT NULL, DEFAULT `'draft'`)
*   `[x]` `questions` (`JSON`, NOT NULL, DEFAULT `'[]'`) — Array de perguntas geradas pela IA.
*   `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
*   `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)

### 1.4 — Adaptar tabelas existentes (`candidato_respostas`)
*   `[x]` Adicionar coluna `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL) à tabela `candidato_respostas`.
*   `[x]` Adicionar coluna `interview_id` (`CHAR(36)`, FK → `interviews(id)`, NOT NULL) à tabela `candidato_respostas`.
*   `[x]` **Crítico:** Migrar dados existentes para associar `candidato_respostas` a `company_id` e `interview_id` (se aplicável, ou definir estratégia para dados legados).
*   `[x]` Adicionar índices nas colunas `company_id` e `interview_id` para performance.

### 1.5 — Implementar Isolamento de Dados a Nível da Aplicação (Essencial para Multi-Tenancy)
*   `[x]` **Crítico:** Garantir que todas as queries à base de dados para tabelas sensíveis (`companies`, `company_members`, `interviews`, `candidato_respostas`) incluem explicitamente `WHERE company_id = '...'`.
*   `[x]` Implementar middleware ou lógica de serviço para validar permissões de acesso baseadas na `role` do utilizador e no `company_id` associado à sessão do utilizador.
*   `[ ]` **Crítico:** Testar exaustivamente a lógica de isolamento de dados para garantir que não há fuga de dados entre empresas.

## FASE 2 — Autenticação e Onboarding (Experiência do Utilizador e Segurança)

### 2.1 — Autenticação (Auth.js / Custom)
*   `[ ]` Configurar **Auth.js (NextAuth.js)** ou uma solução de autenticação customizada para gerir login/signup/logout, integrada com a tabela `users` no MySQL.
*   `[ ]` Criar middleware Next.js para proteger rotas `/admin/*` e `/onboarding`.
*   `[ ]` **Crítico:** Criar middleware para validar `company_id` nas rotas de admin (`/admin/[slug]/*`). Este middleware deve verificar:
    *   `[ ]` Se o utilizador está autenticado.
    *   `[ ]` Se o utilizador é membro da empresa com o slug na URL.
    *   `[ ]` Se o utilizador tem a `role` adequada para aceder à rota específica.

### 2.2 — Onboarding Pós-Pagamento (Primeira Impressão)
*   `[ ]` Criar página `/onboarding` — só acessível a utilizadores autenticados que não possuem uma empresa associada.
*   `[ ]` Formulário de criação de empresa:
    *   `[ ]` Campo: Nome da empresa (obrigatório).
    *   `[ ]` Campo: Slug (auto-gerado a partir do nome, mas editável pelo utilizador; **Crítico:** validar unicidade do slug).
    *   `[ ]` Campo: Descrição (opcional).
    *   `[ ]` Campo: Upload de logo (integrar com **AWS S3** ou serviço similar).
    *   `[ ]` Campo: Cor primária (color picker para branding).
*   `[ ]` Após submissão do formulário:
    *   `[ ]` Criar registo em `companies` com os dados fornecidos.
    *   `[ ]` Criar registo em `company_members` para o utilizador atual com `role: owner`.
    *   `[ ]` **Crítico:** Associar o `stripe_customer_id` (obtido na FASE 3) à nova empresa.
    *   `[ ]` Redirecionar para `/admin/[slug]/dashboard` após criação bem-sucedida.

## FASE 3 — Integração Stripe (Monetização)
Pagamento é o gatilho para criar a empresa. Tem que funcionar antes do onboarding. A robustez desta fase é crucial para o negócio.

*   `[ ]` Criar produtos/preços no Stripe Dashboard (planos: Basic, Pro, Enterprise) e configurar metadados relevantes.
*   `[ ]` Instalar e configurar `stripe` npm package no backend (Next.js API Routes).
*   `[ ]` Criar route handler `POST /api/stripe/checkout`:
    *   `[ ]` Recebe `plan` (basic, pro, enterprise) e `user_id` do frontend.
    *   `[ ]` Cria uma Stripe Checkout Session.
    *   `[ ]` `success_url` → `/onboarding?session_id={CHECKOUT_SESSION_ID}` (para ligar o pagamento ao onboarding).
    *   `[ ]` `cancel_url` → `/pricing`.
    *   `[ ]` **Crítico:** Implementar validação de segurança para evitar manipulação de preços ou planos.
*   `[ ]` Criar webhook `POST /api/stripe/webhook`:
    *   `[ ]` **Crítico:** Validar assinatura do webhook com `stripe.webhooks.constructEvent` para garantir a autenticidade dos eventos.
    *   `[ ]` Evento `checkout.session.completed` → Obter `customer_id` e `subscription_id`. Atualizar `companies` (`stripe_customer_id`, `subscription_status: active`, `plan`).
    *   `[ ]` Evento `invoice.payment_failed` → Marcar `subscription_status: past_due` na empresa.
    *   `[ ]` Evento `customer.subscription.deleted` → Marcar `subscription_status: canceled` na empresa.
    *   `[ ]` Implementar tratamento para outros eventos importantes (ex: `customer.subscription.updated`).
*   `[ ]` Testar webhooks localmente com Stripe CLI (`stripe listen`) e em ambiente de staging.

## FASE 4 — Landing Page Principal (Marketing e Aquisição)
A página pública onde qualquer pessoa descobre o serviço. Deve ser apelativa e clara.

*   `[ ]` Criar página `/` (landing page principal):
    *   `[ ]` Hero section: headline, subheadline, CTA "Ver Planos" (link para `/pricing`).
    *   `[ ]` Secção "Como funciona" (3-4 passos ilustrados, claros e concisos).
    *   `[ ]` Secção de planos/preços (cards com botão "Começar" → Stripe Checkout).
    *   `[ ]` Footer com links essenciais (Termos de Serviço, Política de Privacidade, Contactos).
*   `[ ]` Criar página `/pricing` (planos detalhados) com comparações de funcionalidades.
*   `[ ]` Garantir que estas páginas são públicas (sem autenticação).
*   `[ ]` **Crítico:** Otimizar para SEO e performance (Lighthouse score alto).

## FASE 5 — Área de Admin Multi-Empresa (Gestão Centralizada)
O painel que cada empresa usa para gerir as suas entrevistas. A usabilidade e o isolamento de dados são cruciais.

### 5.1 — Layout e Routing
*   `[ ]` Criar estrutura de rotas: `/admin/[slug]/...` para todas as páginas de administração.
*   `[ ]` Criar layout de admin com sidebar:
    *   `[ ]` Dashboard (`/admin/[slug]/dashboard`)
    *   `[ ]` Entrevistas (`/admin/[slug]/interviews`)
    *   `[ ]` Respostas (`/admin/[slug]/responses`)
    *   `[ ]` Definições da Empresa (`/admin/[slug]/settings`)
    *   `[ ]` Conta/Faturação (`/admin/[slug]/billing`)
*   `[ ]` **Crítico:** Validar no layout que o slug na URL pertence ao utilizador autenticado e que este tem permissão para aceder à empresa. Redirecionar para 404 ou página de erro se não tiver. Esta validação deve ser feita a nível da aplicação, garantindo que todas as queries à base de dados incluem o `company_id` correto.

### 5.2 — Dashboard (`/admin/[slug]/dashboard`)
*   `[ ]` Criar `/admin/[slug]/dashboard`:
    *   `[ ]` Métricas chave: total entrevistas, total candidatos, entrevistas esta semana/mês, taxa de conclusão.
    *   `[ ]` Lista de entrevistas recentes com status e link para respostas.
    *   `[ ]` Visão geral do plano de subscrição atual da empresa.

### 5.3 — Gestão de Entrevistas (`/admin/[slug]/interviews`)
*   `[ ]` Criar `/admin/[slug]/interviews` — lista de todas as entrevistas da empresa, com filtros e pesquisa.
*   `[ ]` Criar `/admin/[slug]/interviews/new` — criar nova entrevista:
    *   `[ ]` Campo: Título da vaga (obrigatório).
    *   `[ ]` Campo: Descrição da vaga (texto livre).
    *   `[ ]` Campo: Número de perguntas desejado (slider ou input numérico).
    *   `[ ]` Botão: "Gerar perguntas com IA" → chama API OpenAI (`/api/ai/generate-questions`).
    *   `[ ]` Lista de perguntas geradas (editáveis inline, com drag-and-drop para reordenar).
    *   `[ ]` Botão: Adicionar pergunta manualmente.
    *   `[ ]` Botão: Apagar pergunta.
    *   `[ ]` Botão: Guardar como rascunho.
    *   `[ ]` Botão: Guardar e Publicar (muda o status da entrevista para `published`).
*   `[ ]` Criar `/admin/[slug]/interviews/[id]/edit` — editar entrevista existente (funcionalidade similar à de criação).

### 5.4 — IA para Geração de Perguntas (`/api/ai/generate-questions`)
*   `[ ]` Criar route handler `POST /api/ai/generate-questions`:
    *   `[ ]` Input: `{ companyId, jobTitle, jobDescription, questionCount }`.
    *   `[ ]` **Crítico:** O `companyId` deve ser validado para garantir que o utilizador tem permissão para a empresa.
    *   `[ ]` System prompt: Contexto da empresa (descrição, setor, etc. obtido da tabela `companies`) + descrição da vaga + pedido de perguntas estruturadas e relevantes.
    *   `[ ]` Modelo: GPT-4o-mini (ou outro modelo adequado da OpenAI).
    *   `[ ]` Output: Array de perguntas em formato JSON (`[{ question: 
..." }]`).
    *   `[ ]` Mostrar loading state enquanto a IA gera as perguntas.
    *   `[ ]` Validar e tratar erros da API OpenAI (ex: limites de tokens, erros de API).

### 5.5 — Respostas de Candidatos (`/admin/[slug]/responses`)
*   `[ ]` Criar `/admin/[slug]/responses` — lista todas as sessões de entrevista para a empresa, com filtros por vaga, candidato, status.
*   `[ ]` Criar `/admin/[slug]/responses/[sessionId]` — página de detalhe de uma sessão:
    *   `[ ]` Informações do candidato (nome, email, telemóvel).
    *   `[ ]` Transcrição completa da conversa com a IA.
    *   `[ ]` Data/hora da entrevista.
    *   `[ ]` **Crítico:** Implementar análise de sentimento ou sumarização com IA para cada resposta (roadmap).
    *   `[ ]` Opção de exportar a transcrição (PDF/CSV).

### 5.6 — Definições da Empresa (`/admin/[slug]/settings`)
*   `[ ]` Criar `/admin/[slug]/settings`:
    *   `[ ]` Formulário para editar nome, descrição, logo, cor primária da empresa.
    *   `[ ]` Mostrar plano atual e data de renovação da subscrição.
    *   `[ ]` Botão "Gerir Faturação" → Redirecionar para o Stripe Customer Portal (usando `stripe_customer_id`).

## FASE 6 — Landing Page por Empresa (Candidatos - Branding)
A página pública de cada empresa, onde os candidatos veem as vagas. Essencial para a experiência do candidato e branding da empresa.

*   `[ ]` Criar rota `/[slug]` — landing page pública da empresa.
*   `[ ]` Mostrar:
    *   `[ ]` Logo e nome da empresa (obtidos da tabela `companies` via `slug`).
    *   `[ ]` Descrição da empresa.
    *   `[ ]` Lista de entrevistas publicadas (vagas abertas) para essa empresa.
*   `[ ]` Cada vaga deve ter um botão "Candidatar-me" → leva para a página de verificação (`/[slug]/interview/[interviewId]`).
*   `[ ]` **Crítico:** Garantir que só aparecem entrevistas com `status = 'published'` e que pertencem a esta empresa (filtrar por `company_id`).
*   `[ ]` Mostrar página 404 se o slug não existir ou se a empresa estiver inativa/cancelada.
*   `[ ]` **Crítico:** Otimizar para SEO e partilha social (Open Graph tags).

## FASE 7 — Fluxo do Candidato (Experiência e Dados)
O que já existe, adaptado para multi-empresa e com foco na persistência e segurança dos dados.

*   `[ ]` Criar `/[slug]/interview/[interviewId]` — página de verificação:
    *   `[ ]` Formulário: Input para Nome, Email, Telemóvel.
    *   `[ ]` **Crítico:** Implementar envio de email de verificação (NodeMailer/Brevo) para o email fornecido.
    *   `[ ]` Guardar token de verificação temporário na base de dados (ex: tabela `verification_tokens` com `expires_at`).
    *   `[ ]` **Crítico:** Associar o token à `company_id` e `interview_id` para evitar abusos.
*   `[ ]` Criar `/[slug]/interview/[interviewId]/verify` — rota para validar o token do email.
    *   `[ ]` Após verificação bem-sucedida, redirecionar para o chat da entrevista (`/[slug]/interview/[interviewId]/chat`).
*   `[ ]` Criar `/[slug]/interview/[interviewId]/chat`:
    *   `[ ]` Chat com IA alimentado pelas perguntas da entrevista (`interviews.questions`).
    *   `[ ]` Contexto da IA deve incluir: descrição da empresa + descrição da vaga + perguntas da entrevista.
    *   `[ ]` **Crítico:** Guardar respostas na DB (`candidato_respostas`) associadas à `company_id`, `interview_id` e `session_id` (para agrupar respostas do mesmo candidato).
    *   `[ ]` Implementar persistência do estado do chat (ex: local storage ou DB) para que o candidato possa continuar mais tarde.
*   `[ ]` Página de conclusão após terminar a entrevista, com mensagem de agradecimento e próximos passos.

## FASE 8 — Testes e Validação (Qualidade e Robustez)
*   `[ ]` Testar fluxo completo end-to-end: registo → pagamento → criação empresa → criar entrevista → candidato faz entrevista → admin vê respostas.
*   `[ ]` Testar isolamento de dados: Garantir que a empresa A não vê dados da empresa B em nenhuma circunstância.
*   `[ ]` Testar permissões de acesso: Com utilizadores com diferentes roles (`owner`, `admin`, `viewer`) e diferentes empresas, garantindo que a lógica de middleware e aplicação funciona corretamente.
*   `[ ]` Testar webhooks Stripe em modo teste (com cartões de teste e simulações de eventos).
*   `[ ]` Testar email de verificação (Brevo/NodeMailer) para garantir que os emails são enviados e os links funcionam.
*   `[ ]` Testar em mobile (responsividade e usabilidade).
*   `[ ]` Testes de performance (carregamento de páginas, queries à DB, tempo de resposta da IA).
*   `[ ]` Testes de segurança (injeção SQL, XSS, etc.).

## FASE 9 — Deploy (Produção e Monitorização)
*   `[ ]` Configurar variáveis de ambiente em produção (Vercel ou cPanel) de forma segura.
*   `[ ]` Configurar domínio personalizado (se aplicável) e certificados SSL.
*   `[ ]` Ativar webhooks Stripe em modo produção e garantir que estão a receber eventos.
*   `[ ]` Verificar que a lógica de isolamento de dados e permissões está ativa em produção e que as políticas estão corretas.
*   `[ ]` Smoke test em produção após o deploy para garantir que tudo funciona como esperado.
*   `[ ]` Configurar monitorização de erros (Sentry, LogRocket) e performance (Vercel Analytics, Google Analytics).
*   `[ ]` Configurar backups automáticos da base de dados.

## Notas Técnicas e Críticas Adicionais

### Estrutura de URLs (Revisão)
*   `/` → Landing page marketing
*   `/pricing` → Página de planos
*   `/onboarding` → Criar empresa (pós-pagamento)
*   `/admin/[slug]/dashboard` → Painel da empresa
*   `/admin/[slug]/interviews` → Gerir entrevistas
*   `/admin/[slug]/responses` → Ver respostas
*   `/admin/[slug]/settings` → Definições da Empresa
*   `/admin/[slug]/billing` → Faturação (novo)
*   `/[slug]` → Landing pública da empresa
*   `/[slug]/interview/[id]` → Verificação candidato
*   `/[slug]/interview/[id]/verify` → Validação de token (novo)
*   `/[slug]/interview/[id]/chat` → Chat da entrevista

### Isolamento de Dados (Crítico e Repetido)
Cada query à DB deve sempre incluir o `company_id` correspondente. Nunca fazer queries globais sem filtro de empresa em rotas autenticadas de admin. Usar middleware de aplicação e validação no código como primeira e segunda linha de defesa e como garantia de segurança.

### Variáveis de Ambiente Necessárias (Revisão)
*   `MYSQL_DATABASE_URL=` (ou variáveis separadas para host, user, password, database)
*   `OPENAI_API_KEY=`
*   `STRIPE_SECRET_KEY=`
*   `STRIPE_WEBHOOK_SECRET=`
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`
*   `BREVO_API_KEY=` (ou NODEMAILER config)
*   `NEXT_PUBLIC_APP_URL=`
*   `AUTH_SECRET=` (para Auth.js)
*   `NEXTAUTH_URL=` (para Auth.js)

### Considerações de Performance
*   Otimizar queries SQL com índices adequados.
*   Caching de dados frequentemente acedidos.
*   Otimização de imagens e assets.
*   Utilização de CDN para assets estáticos.

### Segurança
*   Sanitização e validação de todos os inputs do utilizador para prevenir injeção SQL, XSS, etc.
*   Uso de HTTPS em todas as comunicações.
*   Proteção contra CSRF.
*   Gestão segura de segredos e variáveis de ambiente.

---

**Autor:** Manus AI
**Data:** 20 de Abril de 2026
