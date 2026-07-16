-- ============================================================
-- Migration 002: Adicionar campos de veredito e perfil
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Adicionar colunas de veredito a tabela analyses
-- ============================================================
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS verdict_text text default '' check (char_length(verdict_text) <= 5000),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid references public.profiles(id) on delete set null,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz default null;

COMMENT ON COLUMN public.analyses.verdict_text IS 'Texto do veredito do profissional';
COMMENT ON COLUMN public.analyses.reviewed_by IS 'ID do profissional que revisou';
COMMENT ON COLUMN public.analyses.reviewed_at IS 'Data e hora da revisao';

-- 2. Adicionar colunas de perfil a tabela profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text default '' check (char_length(gender) <= 20),
  ADD COLUMN IF NOT EXISTS age integer default null check (age is null or (age >= 1 and age <= 150)),
  ADD COLUMN IF NOT EXISTS style_objective text default '' check (char_length(style_objective) <= 100),
  ADD COLUMN IF NOT EXISTS profile_picture text default null check (profile_picture is null or char_length(profile_picture) <= 10000);

COMMENT ON COLUMN public.profiles.gender IS 'Genero do usuario';
COMMENT ON COLUMN public.profiles.age IS 'Idade do usuario';
COMMENT ON COLUMN public.profiles.style_objective IS 'Objetivo de estilo do usuario';

-- 3. Atualizar trigger handle_new_user para incluir campos extras do metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, gender, age, style_objective)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.raw_user_meta_data ->> 'gender', ''),
    CASE WHEN new.raw_user_meta_data ->> 'age' ~ '^[0-9]+$'
      THEN (new.raw_user_meta_data ->> 'age')::integer
      ELSE null
    END,
    coalesce(new.raw_user_meta_data ->> 'style_objective', '')
  );
  RETURN new;
END;
$$;

-- 4. Policies para profissionais atualizarem veredictos
-- ============================================================
-- Ja existe "Professionals can update analyses" - cobre update de verdict_text e reviewed_by

-- 5. Index para performance na busca de analises pendentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_analyses_status_created
  ON public.analyses(status, created_at desc);

CREATE INDEX IF NOT EXISTS idx_analyses_reviewed_by
  ON public.analyses(reviewed_by);
