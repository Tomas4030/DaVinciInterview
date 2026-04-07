-- ============================================================
-- DaVinci Interviews — Supabase Schema
-- Corre este script no SQL Editor do teu projeto Supabase
-- ============================================================

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: vagas
-- ============================================================
create table if not exists public.vagas (
  id          text primary key,                         -- slug legível, ex: "fullstack-senior"
  titulo      text        not null,
  descricao   text        default '',
  modalidade  text        not null default 'Remoto',    -- 'Remoto' | 'Híbrido' | 'Presencial'
  duracao_min integer     not null default 10,
  perguntas   jsonb       not null default '[]'::jsonb, -- array de { id, texto, tipo }
  ativa       boolean     not null default true,
  criada_em   timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

-- Actualiza automaticamente atualizada_em
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

create trigger vagas_updated_at
  before update on public.vagas
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: respostas
-- ============================================================
create table if not exists public.respostas (
  id           uuid        primary key default gen_random_uuid(),
  sessao_id    uuid        not null,                     -- agrupa respostas da mesma sessão
  vaga_id      text        not null references public.vagas(id) on delete cascade,
  pergunta_id  integer     not null,                     -- id da pergunta dentro do JSONB
  resposta     text        not null,
  criada_em    timestamptz not null default now()
);

create index if not exists respostas_sessao_idx on public.respostas(sessao_id);
create index if not exists respostas_vaga_idx   on public.respostas(vaga_id);

-- ============================================================
-- TABELA: candidacies
-- ============================================================
create table if not exists public.candidacies (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  telefone     text        not null,
  vaga_id      text        not null references public.vagas(id) on delete cascade,
  sessao_id    uuid        not null unique references public.respostas(sessao_id) on delete cascade,
  email_verificado boolean  not null default false,
  criada_em    timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

-- Índice para buscar candidaturas duplicadas
create unique index if not exists candidacies_unique_idx 
  on public.candidacies(email, telefone, vaga_id) 
  where criada_em > now() - interval '90 days';

-- Atualizar atualizada_em
create trigger candidacies_updated_at
  before update on public.candidacies
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- vagas: leitura pública, escrita apenas autenticados
alter table public.vagas enable row level security;

create policy "Vagas: leitura pública"
  on public.vagas for select
  using (true);

create policy "Vagas: escrita autenticada"
  on public.vagas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- respostas: inserção pública (candidatos), leitura apenas autenticados
alter table public.respostas enable row level security;

create policy "Respostas: inserção pública"
  on public.respostas for insert
  with check (true);

create policy "Respostas: leitura autenticada"
  on public.respostas for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================
insert into public.vagas (id, titulo, descricao, modalidade, duracao_min, perguntas)
values
(
  'fullstack-senior',
  'Programador Full-Stack Sénior',
  'Vaga para programador full-stack com experiência em React e Node.js, num produto SaaS em crescimento.',
  'Remoto',
  12,
  '[
    {"id":1,"texto":"Apresenta-te brevemente e fala sobre o teu percurso profissional.","tipo":"aberta"},
    {"id":2,"texto":"Qual é a tua experiência com React e Next.js? Já trabalhaste com o App Router?","tipo":"aberta"},
    {"id":3,"texto":"Como geres o estado em aplicações de maior escala? (Zustand, Redux, Context API...)","tipo":"aberta"},
    {"id":4,"texto":"Fala sobre a tua experiência com bases de dados — SQL ou NoSQL.","tipo":"aberta"},
    {"id":5,"texto":"Como abordas a escrita de testes automatizados? Que ferramentas utilizas?","tipo":"aberta"},
    {"id":6,"texto":"Descreve um projeto desafiante em que trabalhaste e o que aprendeste.","tipo":"aberta"},
    {"id":7,"texto":"Qual é a tua disponibilidade para início e qual o teu regime preferido?","tipo":"aberta"},
    {"id":8,"texto":"Tens alguma questão sobre a empresa ou a vaga?","tipo":"aberta"}
  ]'::jsonb
),
(
  'ux-designer',
  'UX Designer',
  'Procuramos um UX Designer para liderar a experiência de utilizador do nosso produto principal.',
  'Híbrido',
  10,
  '[
    {"id":1,"texto":"Fala-nos de ti e do teu percurso em design.","tipo":"aberta"},
    {"id":2,"texto":"Como é o teu processo de design, do discovery à entrega?","tipo":"aberta"},
    {"id":3,"texto":"Que ferramentas utilizas no dia-a-dia? (Figma, Maze, etc.)","tipo":"aberta"},
    {"id":4,"texto":"Descreve um projeto em que o design teve impacto direto nos resultados.","tipo":"aberta"},
    {"id":5,"texto":"Como colaboras com equipas de produto e engenharia?","tipo":"aberta"},
    {"id":6,"texto":"Tens alguma questão sobre a equipa ou o projeto?","tipo":"aberta"}
  ]'::jsonb
),
(
  'data-analyst',
  'Data Analyst',
  'Vaga para analista de dados com experiência em SQL, Python e visualização de dados.',
  'Remoto',
  8,
  '[
    {"id":1,"texto":"Apresenta-te e fala sobre a tua experiência com dados.","tipo":"aberta"},
    {"id":2,"texto":"Qual é o teu nível de conforto com SQL? Dá um exemplo de uma query complexa que escreveste.","tipo":"aberta"},
    {"id":3,"texto":"Que ferramentas de visualização preferes e porquê? (Tableau, Looker, PowerBI, etc.)","tipo":"aberta"},
    {"id":4,"texto":"Como comunicas insights de dados a stakeholders não técnicos?","tipo":"aberta"},
    {"id":5,"texto":"Qual é a tua experiência com Python ou R para análise de dados?","tipo":"aberta"}
  ]'::jsonb
)
on conflict (id) do nothing;
