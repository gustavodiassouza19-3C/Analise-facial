-- ============================================================
-- Migration 007: Adicionar coluna body_result
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Adiciona coluna para armazenar o resultado da avaliacao do fisico (jsonb)
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS body_result jsonb;

COMMENT ON COLUMN public.analyses.body_result IS 'Resultado da avaliacao do fisico (postura, proporcao, simetria, definicao, notas)';
