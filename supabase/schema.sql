-- EXTENSÃO NECESSÁRIA (UUID)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TABELA PRINCIPAL
-- =========================
CREATE TABLE IF NOT EXISTS public.candidato_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  vaga_id TEXT NOT NULL,
  sessao_id UUID NOT NULL UNIQUE,

  respostas JSONB NOT NULL DEFAULT '[]'::jsonb,

  status TEXT NOT NULL DEFAULT 'em_progresso',
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,

  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT candidato_respostas_status_check
    CHECK (status IN ('em_progresso', 'concluida', 'rejeitada', 'em_analise'))
);

-- =========================
-- ÍNDICES (PERFORMANCE)
-- =========================
CREATE INDEX IF NOT EXISTS candidato_respostas_email_idx
  ON public.candidato_respostas(email);

CREATE INDEX IF NOT EXISTS candidato_respostas_vaga_idx
  ON public.candidato_respostas(vaga_id);

CREATE INDEX IF NOT EXISTS candidato_respostas_sessao_idx
  ON public.candidato_respostas(sessao_id);

CREATE INDEX IF NOT EXISTS candidato_respostas_lookup_idx
  ON public.candidato_respostas(email, telefone, vaga_id, criada_em DESC);

-- =========================
-- TRIGGER updated_at
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizada_em = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidato_respostas_updated_at
ON public.candidato_respostas;

CREATE TRIGGER candidato_respostas_updated_at
  BEFORE UPDATE ON public.candidato_respostas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 🔥 TRIGGER ANTI-DUPLICADOS (90 DIAS)
-- =========================
CREATE OR REPLACE FUNCTION public.prevent_duplicate_candidatura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.candidato_respostas
    WHERE email = NEW.email
      AND telefone = NEW.telefone
      AND vaga_id = NEW.vaga_id
      AND criada_em >= NOW() - INTERVAL '90 days'
  ) THEN
    RAISE EXCEPTION 'Já existe uma candidatura para esta vaga nos últimos 90 dias';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidato_respostas_prevent_duplicate
ON public.candidato_respostas;

CREATE TRIGGER candidato_respostas_prevent_duplicate
  BEFORE INSERT ON public.candidato_respostas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_candidatura();

-- =========================
-- RLS (SEGURANÇA)
-- =========================
ALTER TABLE public.candidato_respostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidatos: inserção pública"
ON public.candidato_respostas;

CREATE POLICY "Candidatos: inserção pública"
  ON public.candidato_respostas
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Candidatos: leitura autenticada"
ON public.candidato_respostas;

CREATE POLICY "Candidatos: leitura autenticada"
  ON public.candidato_respostas
  FOR SELECT
  USING (auth.role() = 'authenticated');