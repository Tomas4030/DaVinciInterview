# Análise de Gaps e Inconsistências — DaVinci Interview

## 1. Estrutura de Base de Dados (Supabase)
- **Atual:** A tabela `candidato_respostas` existe, mas não há uma tabela de `vagas` ou `empresas` formalizada no `schema.sql` (embora o código mencione `vaga_id`).
- **Necessidade Multi-SaaS:** É imperativo criar a tabela `companies` e `company_members` para isolar os dados. O `vaga_id` deve ser uma FK para uma tabela de `vagas` que, por sua vez, pertence a uma `company_id`.
- **RLS:** As políticas de Row Level Security (RLS) atuais são básicas ou inexistentes no script. Precisam de ser rigorosas para evitar vazamento de dados entre empresas.

## 2. Autenticação e Autorização
- **Atual:** Existe uma pasta `(protected)` no admin, sugerindo que já existe middleware ou proteção de rotas.
- **Necessidade:** O middleware precisa de ser atualizado para validar não só se o user está logado, mas se ele tem acesso ao `slug` da empresa na URL (`/admin/[slug]`).

## 3. Fluxo de Candidato
- **Atual:** A rota é `/entrevista/[vagaId]`. 
- **Necessidade:** Para um SaaS profissional, a URL deve refletir a marca da empresa: `/[company-slug]/[vaga-slug]`. Isso melhora o SEO e a confiança do candidato.
- **Verificação:** O ficheiro `ideias.md` sugere verificação por email. Atualmente, o fluxo parece ser direto. É necessário implementar o sistema de tokens de verificação.

## 4. Integração de IA
- **Atual:** O projeto usa OpenAI para análise.
- **Crítica:** A geração de perguntas deve ser mais dinâmica e baseada no contexto da empresa, não apenas na vaga. Falta um sistema de "feedback em tempo real" ou "follow-up questions" baseado na resposta do candidato para tornar a entrevista menos "formulário" e mais "conversa".

## 5. Pagamentos (Stripe)
- **Status:** Não foi encontrada nenhuma referência a Stripe no código atual. Esta é uma peça fundamental que falta para o modelo SaaS.

## 6. UX/UI
- **Dashboard Admin:** Precisa de uma visão consolidada. Atualmente parece focado em vagas individuais.
- **Branding:** O suporte para cores e logos customizados por empresa é mencionado no `ideias.md` mas não está implementado no frontend.
