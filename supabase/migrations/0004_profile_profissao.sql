-- Adiciona campo `profissao` na tabela profiles.
-- Usado no cadastro de clientes pra análise de crédito do Plano Conquista.

alter table public.profiles
  add column if not exists profissao text;

comment on column public.profiles.profissao is
  'Profissão do cliente — usada na análise pra Plano Conquista.';
