# MatchWorky Interview — TODO List (SaaS Multi-Empresa) - Adaptado para MySQL (Reorganizado)

**Regra:** Completa cada fase sequencialmente. Não passes à fase seguinte sem terminar a anterior. Assinala cada item com `[x]` quando terminares.

## FASE 0 — Auditoria e Preparação (Crítica e Aprofundada)

Perceber o que já existe antes de tocar em código, com foco em segurança e escalabilidade.

- `[x]` Auditar a estrutura atual do projeto (páginas, componentes, DB schema).
- `[x]` Mapear todas as tabelas MySQL existentes e suas relações. (Observação: `candidato_respostas` existe, mas falta uma tabela `vagas` explícita e `companies`).
- `[x]` Listar todas as rotas Next.js existentes (App Router ou Pages) e identificar as que precisam de ser protegidas ou adaptadas para multi-empresa.
- `[x]` Identificar hard-coded references à empresa atual (nomes, IDs, assets) e planear a sua parametrização.
- `[x]` **Crítico:** Documentar o fluxo de autenticação atual e as permissões de acesso.
- `[ ]` Criar tag de backup `v0-single-company` com worktree limpo (pendente da auditoria inicial).

## FASE 1 — Base de Dados Multi-Empresa (Fundação Sólida)

Toda a app assenta nisto. Tem que ficar sólido antes de avançar. A segurança dos dados é primordial.

### 1.1 — Tabela `companies`

Criar tabela `companies` com os campos:

- `[x]` `id` (`CHAR(36)`, PK, NOT NULL) – Usar `UUID()` do MySQL ou gerar UUIDs na aplicação (ex: `uuidv4` em Node.js).
- `[x]` `name` (`VARCHAR(255)`, NOT NULL)
- `[x]` `slug` (`VARCHAR(255)`, NOT NULL, UNIQUE) — usado na URL: `MatchWorky.com/empresa-slug`. **Crítico:** Implementar lógica de geração de slug única e amigável.
- `[x]` `description` (`TEXT`)
- `[x]` `logo_url` (`VARCHAR(255)`, nullable) — URL para o logo da empresa.
- `[x]` `primary_color` (`VARCHAR(7)`, nullable) — para branding por empresa (ex: `#RRGGBB`).
- `[x]` `owner_id` (`CHAR(36)`, FK → `users(id)`, NOT NULL) — O utilizador que criou a empresa.
- `[ ]` `stripe_customer_id` (`VARCHAR(255)`, nullable, UNIQUE) — ID do cliente no Stripe para gestão de subscrições. (Movido para FASE 7)
- `[ ]` `subscription_status` (`ENUM(\'trialing\', \'active\', \'past_due\', \'canceled\')`, NOT NULL, DEFAULT `\'trialing\'`) (Movido para FASE 7)
- `[ ]` `plan` (`ENUM(\'basic\', \'pro\', \'enterprise\')`, NOT NULL, DEFAULT `\'basic\'`) (Movido para FASE 7)
- `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`) — Adicionar trigger para atualizar automaticamente.

### 1.2 — Tabela `company_members` (Gestão de Acessos)

Criar tabela `company_members`:

- `[x]` `id` (`CHAR(36)`, PK, NOT NULL) – Usar `UUID()` do MySQL ou gerar UUIDs na aplicação.
- `[x]` `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL)
- `[x]` `user_id` (`CHAR(36)`, FK → `users(id)`, NOT NULL)
- `[x]` `role` (`ENUM(\'owner\', \'admin\', \'viewer\')`, NOT NULL, DEFAULT `\'viewer\'`)
- `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
- `[x]` **Crítico:** Adicionar `UNIQUE(company_id, user_id)` para evitar duplicação de membros.

### 1.3 — Tabela `interviews` (Vagas)

Criar tabela `interviews` (se ainda não existir ou adaptar a existente `vagas`):

- `[x]` `id` (`CHAR(36)`, PK)
- `[x]` `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL)
- `[x]` `title` (`VARCHAR(255)`, NOT NULL)
- `[x]` `description` (`TEXT`)
- `[x]` `status` (`ENUM(\'draft\', \'published\', \'archived\')`, NOT NULL, DEFAULT `\'draft\'`)
- `[x]` `questions` (`JSON`, NOT NULL, DEFAULT `\'[]\'`)
- `[x]` `created_at` (`DATETIME`, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- `[x]` `updated_at` (`DATETIME`, DEFAULT `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)

### 1.4 — Adaptar tabelas existentes (`candidato_respostas`)

- `[x]` Adicionar coluna `company_id` (`CHAR(36)`, FK → `companies(id)`, NOT NULL) à tabela `candidato_respostas`.
- `[x]` Adicionar coluna `interview_id` (`CHAR(36)`, FK → `interviews(id)`, NOT NULL) à tabela `candidato_respostas`.
- `[x]` **Crítico:** Migrar dados existentes para associar `candidato_respostas` a `company_id` e `interview_id` (se aplicável, ou definir estratégia para dados legados).
- `[x]` Adicionar índices nas colunas `company_id` e `interview_id` para performance.

### 1.5 — Implementar Isolamento de Dados a Nível da Aplicação (Essencial para Multi-Tenancy)

- `[ ]` **Crítico:** Garantir que todas as queries à base de dados para tabelas sensíveis (`companies`, `company_members`, `interviews`, `candidato_respostas`) incluem explicitamente `WHERE company_id = \'...\'` (Parcial no código novo; legado ainda por fechar).
- `[x]` Implementar middleware ou lógica de serviço para validar permissões de acesso baseadas na `role` do utilizador e no `company_id` associado à sessão do utilizador.
- `[ ]` **Crítico:** Testar exaustivamente a lógica de isolamento de dados para garantir que não há fuga de dados entre empresas.

## FASE 2 — Autenticação e Onboarding (Base)

Focar na autenticação de utilizadores e no fluxo de criação de empresa, sem a integração de pagamentos.

### 2.1 — Autenticação (Auth.js / Custom)

- `[x]` Configurar **Auth.js (NextAuth.js)** ou uma solução de autenticação customizada para gerir login/signup/logout, integrada com a tabela `users` no MySQL.
- `[x]` Criar middleware Next.js para proteger rotas `/admin/*` e `/onboarding`.
- `[x]` **Crítico:** Criar middleware para validar `company_id` nas rotas de admin (`/admin/[slug]/*`). Este middleware deve verificar:
  - `[x]` Se o utilizador está autenticado.
  - `[x]` Se o utilizador é membro da empresa com o slug na URL.
  - `[x]` Se o utilizador tem a `role` adequada para aceder à rota específica.

### 2.2 — Onboarding (Criação de Empresa)

- `[x]` Criar página `/onboarding` — só acessível a utilizadores autenticados que não possuem uma empresa associada.
- `[x]` Formulário de criação de empresa:
  - `[x]` Campo: Nome da empresa (obrigatório).
  - `[x]` Campo: Slug (auto-gerado a partir do nome, mas editável pelo utilizador; **Crítico:** validar unicidade do slug).
  - `[x]` Campo: Descrição (opcional).
  - `[ ]` Campo: Upload de logo (integrar com **AWS S3** ou serviço similar).
  - `[x]` Campo: Cor primária (color picker para branding).
- `[x]` Após submissão do formulário:
  - `[x]` Criar registo em `companies` com os dados fornecidos.
  - `[x]` Criar registo em `company_members` para o utilizador atual com `role: owner`.
  - `[x]` Redirecionar para `/admin/[slug]/dashboard` após criação bem-sucedida.

## FASE 3 — Desenvolvimento de Layouts Públicos (Landing Pages)

Focar na criação das interfaces de utilizador para as páginas públicas, garantindo uma experiência visual apelativa.

### 3.1 — Landing Page Principal (`/`)

- `[x]` Criar página `/` (landing page principal):
  - `[x]` Hero section: headline, subheadline, CTA "Ver Planos" (link para `/pricing`).
  - `[x]` Secção "Como funciona" (3-4 passos ilustrados, claros e concisos).
  - `[x]` Secção de planos/preços (cards com botão "Começar" → **Placeholder para Stripe Checkout**).
  - `[x]` Footer com links essenciais (Termos de Serviço, Política de Privacidade, Contactos).
- `[x]` Criar página `/pricing` (planos detalhados) com comparações de funcionalidades.
- `[x]` Garantir que estas páginas são públicas (sem autenticação).
- `[ ]` **Crítico:** Otimizar para SEO e performance (Lighthouse score alto).

### 3.2 — Landing Page por Empresa (`/[slug]`)

- `[x]` Criar rota `/[slug]` — landing page pública da empresa.
- `[x]` Mostrar:
  - `[x]` Logo e nome da empresa (obtidos da tabela `companies` via `slug`).
  - `[x]` Descrição da empresa.
  - `[x]` Lista de entrevistas publicadas (vagas abertas) para essa empresa.
- `[x]` Cada vaga deve ter um botão "Candidatar-me" → leva para a página de verificação (`/[slug]/interview/[interviewId]`).
- `[x]` **Crítico:** Garantir que só aparecem entrevistas com `status = \'published\'` e que pertencem a esta empresa (filtrar por `company_id`).
- `[x]` Mostrar página 404 se o slug não existir ou se a empresa estiver inativa/cancelada.
- `[x]` **Crítico:** Otimizar para SEO e partilha social (Open Graph tags).

## FASE 4 — Desenvolvimento de Layouts da Área de Admin

Focar na criação das interfaces de utilizador para a área de administração de cada empresa.
Quero q uses os layouts antigos ver na pasta \old_site

### 4.1 — Layout e Routing da Área de Admin

- `[x]` Criar estrutura base de rotas: `/admin/[slug]/...` (index + dashboard inicial).
- `[x]` Criar layout de admin com sidebar:
  - `[x]` Dashboard (`/admin/[slug]/dashboard`)
  - `[x]` Entrevistas (`/admin/[slug]/interviews`)
  - `[x]` Respostas (`/admin/[slug]/responses`)
  - `[x]` Definições da Empresa (`/admin/[slug]/settings`)
  - `[x]` Conta/Faturação (`/admin/[slug]/billing`) — **Placeholder para Stripe**
- `[x]` **Crítico:** Validar no layout que o slug na URL pertence ao utilizador autenticado e que este tem permissão para aceder à empresa. Redirecionar para 404 ou página de erro se não tiver. Esta validação deve ser feita a nível da aplicação, garantindo que todas as queries à base de dados incluem o `company_id` correto.

### 4.2 — Dashboard (`/admin/[slug]/dashboard`)

- `[x]` Criar `/admin/[slug]/dashboard`:
  - `[x]` Métricas chave: total entrevistas, total candidatos, entrevistas esta semana/mês, taxa de conclusão.
  - `[x]` Lista de entrevistas recentes com status e link para respostas.
  - `[x]` Visão geral do plano de subscrição atual da empresa (Placeholder).

### 4.3 — Gestão de Entrevistas (`/admin/[slug]/interviews`)

- `[x]` Criar `/admin/[slug]/interviews` — lista de todas as entrevistas da empresa, com filtros e pesquisa.
- `[x]` Criar `/admin/[slug]/interviews/new` — criar nova entrevista:
  - `[x]` Campo: Título da vaga (obrigatório).
  - `[x]` Campo: Descrição da vaga (texto livre).
  - `[x]` Campo: Número de perguntas desejado (slider ou input numérico).
  - `[x]` Botão: "Gerar perguntas com IA" → **Placeholder para API OpenAI**.
  - `[x]` Lista de perguntas geradas (editáveis inline, com reordenação manual).
  - `[x]` Botão: Adicionar pergunta manualmente.
  - `[x]` Botão: Apagar pergunta.
  - `[x]` Botão: Guardar como rascunho.
  - `[x]` Botão: Guardar e Publicar (muda o status da entrevista para `published`).
- `[x]` Criar `/admin/[slug]/interviews/[id]/edit` — editar entrevista existente (funcionalidade similar à de criação).

### 4.4 — Respostas de Candidatos (`/admin/[slug]/responses`)

- `[x]` Criar `/admin/[slug]/responses` — lista todas as sessões de entrevista para a empresa, com filtros por vaga, candidato, status.
- `[x]` Criar `/admin/[slug]/responses/[sessionId]` — página de detalhe de uma sessão:
  - `[x]` Informações do candidato (nome, email, telemóvel).
  - `[x]` Transcrição completa da conversa com a IA.
  - `[x]` Data/hora da entrevista.
  - `[ ]` **Crítico:** Implementar análise de sentimento ou sumarização com IA para cada resposta (roadmap).
  - `[ ]` Opção de exportar a transcrição (PDF/CSV).

### 4.5 — Definições da Empresa (`/admin/[slug]/settings`)

- `[x]` Criar `/admin/[slug]/settings`:
  - `[x]` Formulário para editar nome, descrição e logo da empresa.

## FASE 5 — Desenvolvimento do Fluxo do Candidato (UI/UX)

Focar na criação das interfaces de utilizador para o fluxo de candidatura, desde a verificação até ao chat com a IA.
Quero q uses os layouts antigos ver na pasta \old_site

### 5.1 — Fluxo de Verificação do Candidato


- `[ ]` Criar `/[slug]/interview/[interviewId]` — página de verificação:
  - `[ ]` Formulário: Input para Nome, Email, Telemóvel.
  - `[ ]` **Crítico:** Implementar envio de email de verificação (NodeMailer/Brevo) para o email fornecido.
  - `[ ]` Guardar token de verificação temporário na base de dados (ex: tabela `verification_tokens` com `expires_at`).
  - `[ ]` **Crítico:** Associar o token à `company_id` e `interview_id` para evitar abusos.
- `[ ]` Criar `/[slug]/interview/[interviewId]/verify` — rota para validar o token do email.
  - `[ ]` Após verificação bem-sucedida, redirecionar para o chat da entrevista (`/[slug]/interview/[interviewId]/chat`).

### 5.2 — Chat da Entrevista (`/[slug]/interview/[interviewId]/chat`)

- `[ ]` Criar `/[slug]/interview/[interviewId]/chat`:
  - `[ ]` Chat com IA alimentado pelas perguntas da entrevista (`interviews.questions`).
  - `[ ]` Contexto da IA deve incluir: descrição da empresa + descrição da vaga + perguntas da entrevista.
  - `[ ]` Implementar persistência do estado do chat (ex: local storage ou DB) para que o candidato possa continuar mais tarde.
- `[ ]` Página de conclusão após terminar a entrevista, com mensagem de agradecimento e próximos passos.

## FASE 6 — Implementação da Lógica de Negócio e Integração de Dados

Conectar as interfaces de utilizador com o backend, implementar as funcionalidades principais e garantir o isolamento de dados.

### 6.1 — Lógica de Autenticação e Onboarding

- `[x]` Conectar o formulário de criação de empresa (FASE 2.2) com a base de dados para criar registos em `companies` e `company_members`.
- `[x]` Implementar a lógica de validação de `company_id` e `role` nos middlewares (FASE 2.1).

### 6.2 — Lógica das Landing Pages Públicas

- `[x]` Conectar a Landing Page Principal (FASE 3.1) com os dados de planos (placeholder por enquanto).
- `[x]` Conectar a Landing Page por Empresa (FASE 3.2) com os dados da tabela `companies` e `interviews`.

### 6.3 — Lógica da Área de Admin

- `[ ]` Conectar o Dashboard (FASE 4.2) com as métricas da base de dados.
- `[ ]` Implementar a criação, edição e publicação de entrevistas (FASE 4.3), incluindo a persistência das perguntas geradas pela IA.
- `[ ]` Criar route handler `POST /api/ai/generate-questions` (FASE 4.3):
  - `[ ]` Input: `{ companyId, jobTitle, jobDescription, questionCount }`.
  - `[ ]` **Crítico:** O `companyId` deve ser validado para garantir que o utilizador tem permissão para a empresa.
  - `[ ]` System prompt: Contexto da empresa (descrição, setor, etc. obtido da tabela `companies`) + descrição da vaga + pedido de perguntas estruturadas e relevantes.
  - `[ ]` Modelo: GPT-4o-mini (ou outro modelo adequado da OpenAI).
  - `[ ]` Output: Array de perguntas em formato JSON (`[{ question: \"...\" }]`).
  - `[ ]` Mostrar loading state enquanto a IA gera as perguntas.
  - `[ ]` Validar e tratar erros da API OpenAI (ex: limites de tokens, erros de API).
- `[ ]` Conectar a visualização de Respostas de Candidatos (FASE 4.4) com a tabela `candidato_respostas`.
- `[ ]` Implementar a edição das Definições da Empresa (FASE 4.5).

### 6.4 — Lógica do Fluxo do Candidato

- `[ ]` Implementar o envio de email de verificação e a validação do token (FASE 5.1).
- `[ ]` Conectar o chat da entrevista (FASE 5.2) com a API da IA e guardar as respostas na DB (`candidato_respostas`).
- `[ ]` **Crítico:** Guardar respostas na DB (`candidato_respostas`) associadas à `company_id`, `interview_id` e `session_id` (para agrupar respostas do mesmo candidato).

## FASE 7 — Integração Stripe (Monetização)

Integrar o sistema de pagamentos para gerir subscrições e planos.

### 7.1 — Atualização da Tabela `companies`

- `[ ]` Adicionar `stripe_customer_id` (`VARCHAR(255)`, nullable, UNIQUE) à tabela `companies`.
- `[ ]` Adicionar `subscription_status` (`ENUM(\'trialing\', \'active\', \'past_due\', \'canceled\')`, NOT NULL, DEFAULT `\'trialing\'`) à tabela `companies`.
- `[ ]` Adicionar `plan` (`ENUM(\'basic\', \'pro\', \'enterprise\')`, NOT NULL, DEFAULT `\'basic\'`) à tabela `companies`.

### 7.2 — Configuração e Webhooks Stripe

- `[ ]` Criar produtos/preços no Stripe Dashboard (planos: Basic, Pro, Enterprise) e configurar metadados relevantes.
- `[ ]` Instalar e configurar `stripe` npm package no backend (Next.js API Routes).
- `[ ]` Criar route handler `POST /api/stripe/checkout`:
  - `[ ]` Recebe `plan` (basic, pro, enterprise) e `user_id` do frontend.
  - `[ ]` Cria uma Stripe Checkout Session.
  - `[ ]` `success_url` → `/onboarding?session_id={CHECKOUT_SESSION_ID}` (para ligar o pagamento ao onboarding).
  - `[ ]` `cancel_url` → `/pricing`.
  - `[ ]` **Crítico:** Implementar validação de segurança para evitar manipulação de preços ou planos.
- `[ ]` Criar webhook `POST /api/stripe/webhook`:
  - `[ ]` **Crítico:** Validar assinatura do webhook com `stripe.webhooks.constructEvent` para garantir a autenticidade dos eventos.
  - `[ ]` Evento `checkout.session.completed` → Obter `customer_id` e `subscription_id`. Atualizar `companies` (`stripe_customer_id`, `subscription_status: active`, `plan`).
  - `[ ]` Evento `invoice.payment_failed` → Marcar `subscription_status: past_due` na empresa.
  - `[ ]` Evento `customer.subscription.deleted` → Marcar `subscription_status: canceled` na empresa.
  - `[ ]` Implementar tratamento para outros eventos importantes (ex: `customer.subscription.updated`).
- `[ ]` Testar webhooks localmente com Stripe CLI (`stripe listen`) e em ambiente de staging.

### 7.3 — Integração com Onboarding e Área de Admin

- `[ ]` Associar o `stripe_customer_id` (obtido na FASE 7.2) à nova empresa durante o onboarding (FASE 2.2).
- `[ ]` Exibir informações de faturação e plano na área de admin (`/admin/[slug]/billing` e Dashboard FASE 4.2).

## FASE 8 — Testes e Validação (Qualidade e Robustez)

- `[ ]` Testar fluxo completo end-to-end: registo → pagamento → criação empresa → criar entrevista → candidato faz entrevista → admin vê respostas.
- `[ ]` Testar isolamento de dados: Garantir que a empresa A não vê dados da empresa B em nenhuma circunstância.
- `[ ]` Testar permissões de acesso: Com utilizadores com diferentes roles (`owner`, `admin`, `viewer`) e diferentes empresas, garantindo que a lógica de middleware e aplicação funciona corretamente.
- `[ ]` Testar webhooks Stripe em modo teste (com cartões de teste e simulações de eventos).
- `[ ]` Testar email de verificação (Brevo/NodeMailer) para garantir que os emails são enviados e os links funcionam.
- `[ ]` Testar em mobile (responsividade e usabilidade).
- `[ ]` Testes de performance (carregamento de páginas, queries à DB, tempo de resposta da IA).
- `[ ]` Testes de segurança (injeção SQL, XSS, etc.).

## FASE 9 — Deploy (Produção e Monitorização)

- `[ ]` Configurar variáveis de ambiente em produção (Vercel ou cPanel) de forma segura.
- `[ ]` Configurar domínio personalizado (se aplicável) e certificados SSL.
- `[ ]` Ativar webhooks Stripe em modo produção e garantir que estão a receber eventos.
- `[ ]` Verificar que a lógica de isolamento de dados e permissões está ativa em produção e que as políticas estão corretas.
- `[ ]` Smoke test em produção após o deploy para garantir que tudo funciona como esperado.
- `[ ]` Configurar monitorização de erros (Sentry, LogRocket) e performance (Vercel Analytics, Google Analytics).
- `[ ]` Configurar backups automáticos da base de dados.

## FASE 10 — Dashboard de Superadmin (Visão Geral e Gestão Global)

Desenvolver a interface e a lógica de backend para o dashboard de superadministrador, permitindo uma visão e gestão centralizada da plataforma.

### 10.1 — Base de Dados para Métricas Globais (Se Necessário)

- `[ ]` Avaliar a necessidade de tabelas ou views dedicadas para agregar métricas globais de forma eficiente (ex: `platform_metrics`, `token_usage_logs`).
- `[ ]` Implementar triggers ou jobs para popular estas tabelas de métricas, se necessário.

### 10.2 — Layout e Routing do Dashboard de Superadmin

- `[ ]` Criar estrutura de rotas: `/superadmin/...` (ex: `/superadmin/dashboard`, `/superadmin/companies`).
- `[ ]` Criar layout de superadmin com sidebar e navegação específica.
- `[ ]` **Crítico:** Implementar middleware para proteger rotas `/superadmin/*`, garantindo que apenas utilizadores com `role: superadmin` (nova role) podem aceder.

### 10.3 — Métricas Gerais

- `[ ]` Desenvolver componentes para exibir:
  - `[ ]` **Número total de empresas ativas**.
  - `[ ]` **Empresas criadas neste mês**.
  - `[ ]` **Planos em uso** (quantidade por tipo de plano).
  - `[ ]` **Receita mensal** (baseada nos recebimentos via planos).

### 10.4 — Consumo de Tokens

- `[ ]` Desenvolver componentes para exibir:
  - `[ ]` **Total de tokens consumidos** (geral).
  - `[ ]` **Tokens consumidos por mês** (integrar com biblioteca de gráficos, ex: Chart.js ou Recharts).
  - `[ ]` **Consumo médio de tokens por empresa**.
  - `[ ]` **Empresas com maior consumo de tokens** (lista paginada).

### 10.5 — Estatísticas de Entrevistas

- `[ ]` Desenvolver componentes para exibir:
  - `[ ]` **Total de entrevistas criadas** (geral e por mês).
  - `[ ]` **Total de respostas registradas** (geral e por mês).
  - `[ ]` **Média de respostas por entrevista**.
  - `[ ]` **Crescimento das entrevistas criadas** (integrar com biblioteca de gráficos).

### 10.6 — Gestão de Planos

- `[ ]` Desenvolver componentes para exibir e gerir:
  - `[ ]` **Lista de empresas por plano** (básico, premium, etc.) com filtros e pesquisa.
  - `[ ]` **Empresas próximas de upgrade de plano** (baseado no uso de tokens/recursos).
  - `[ ]` **Empresas inativas ou com pouca atividade**.

### 10.7 — Gestão Financeira

- `[ ]` Desenvolver componentes para exibir:
  - `[ ]` **Relatório de faturamento** (mensal e anual).
  - `[ ]` **Empresas inadimplentes ou com pagamentos pendentes**.
  - `[ ]` **Receita por plano**.
  - `[ ]` **Projeção de crescimento** (baseado no histórico).

### 10.8 — Gestão de Contas

- `[ ]` Desenvolver componentes para exibir e gerir:
  - `[ ]` **Lista de empresas com detalhes de contato** (com opções de edição).
  - `[ ]` Funcionalidade para **Adicionar/remover empresas** (com confirmação).
  - `[ ]` Funcionalidade para **Gerenciar permissões de acesso para administradores de empresa** (ex: alterar `role` de `owner` para `admin`).

### 10.9 — Alertas e Notificações

- `[ ]` Desenvolver sistema de alertas para:
  - `[ ]` **Empresas com atividade anormal** (alta ou baixa, baseada em thresholds configuráveis).
  - `[ ]` **Alertas de uso excessivo de tokens**.
  - `[ ]` **Avisos de expiração de plano**.

## FASE 11 — Testes e Validação do Superadmin (Qualidade e Robustez)

- `[ ]` Testar o acesso ao dashboard de superadmin (apenas para `role: superadmin`).
- `[ ]` Validar a precisão de todas as métricas e gráficos exibidos.
- `[ ]` Testar as funcionalidades de gestão (adicionar/remover empresas, gerir permissões).
- `[ ]` Testar o sistema de alertas e notificações.
- `[ ]` Testar a performance do dashboard com um grande volume de dados.

## FASE 12 — Deploy do Superadmin (Produção e Monitorização)

- `[ ]` Configurar variáveis de ambiente específicas para o superadmin (se houver).
- `[ ]` Garantir que as rotas de superadmin estão protegidas em produção.
- `[ ]` Monitorizar o desempenho e erros do dashboard de superadmin.

## Notas Técnicas e Críticas Adicionais

### Estrutura de URLs (Revisão)

- `/` → Landing page marketing
- `/pricing` → Página de planos
- `/onboarding` → Criar empresa (pós-pagamento)
- `/admin/[slug]/dashboard` → Painel da empresa
- `/admin/[slug]/interviews` → Gerir entrevistas
- `/admin/[slug]/responses` → Ver respostas
- `/admin/[slug]/settings` → Definições da Empresa
- `/admin/[slug]/billing` → Faturação (novo)
- `/superadmin/dashboard` → Dashboard de Superadmin (novo)
- `/superadmin/companies` → Gestão de Empresas (novo)
- `/[slug]` → Landing pública da empresa
- `/[slug]/interview/[id]` → Verificação candidato
- `/[slug]/interview/[id]/verify` → Validação de token (novo)
- `/[slug]/interview/[id]/chat` → Chat da entrevista

### Isolamento de Dados (Crítico e Repetido)

Cada query à DB deve sempre incluir o `company_id` correspondente. Nunca fazer queries globais sem filtro de empresa em rotas autenticadas de admin. Usar middleware de aplicação e validação no código como primeira e segunda linha de defesa e como garantia de segurança. Para o dashboard de superadmin, as queries serão globais, mas devem ser executadas com as devidas permissões e otimizações.

### Variáveis de Ambiente Necessárias (Revisão)

- `MYSQL_DATABASE_URL=` (ou variáveis separadas para host, user, password, database)
- `OPENAI_API_KEY=`
- `STRIPE_SECRET_KEY=`
- `STRIPE_WEBHOOK_SECRET=`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`
- `BREVO_API_KEY=` (ou NODEMAILER config)
- `NEXT_PUBLIC_APP_URL=`
- `AUTH_SECRET=` (para Auth.js)
- `NEXTAUTH_URL=` (para Auth.js)
- `SUPERADMIN_SECRET_KEY=` (para proteger rotas de superadmin, ou gerir via DB)

### Considerações de Performance

- Otimizar queries SQL com índices adequados.
- Caching de dados frequentemente acedidos.
- Otimização de imagens e assets.
- Utilização de CDN para assets estáticos.
- Para o dashboard de superadmin, considerar agregação de dados em background para evitar queries pesadas em tempo real.

### Segurança

- Sanitização e validação de todos os inputs do utilizador para prevenir injeção SQL, XSS, etc.
- Uso de HTTPS em todas as comunicações.
- Proteção contra CSRF.
- Gestão segura de segredos e variáveis de ambiente.
- Implementar autenticação robusta para o superadmin, possivelmente com 2FA.

---
