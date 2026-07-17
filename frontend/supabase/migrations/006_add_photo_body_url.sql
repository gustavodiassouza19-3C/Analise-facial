-- ============================================================
-- Migration 006: Adicionar coluna photo_body_url
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Adiciona coluna para armazenar a URL da foto do fisico (opcional)
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS photo_body_url text;

COMMENT ON COLUMN public.analyses.photo_body_url IS 'URL da foto do fisico (frontal do corpo) - opcional';
