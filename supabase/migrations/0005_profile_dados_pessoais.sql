-- 0005_profile_dados_pessoais.sql
-- Adiciona campos restantes do contrato KEU LOCA MOTOS no profile.
-- Antes faltavam: sexo, nascimento, naturalidade — agora todos os dados
-- pra preencher o contrato vêm do cadastro do cliente, sem digitar de novo.

alter table public.profiles
  add column if not exists sexo text
    check (sexo in ('masculino', 'feminino', 'outro') or sexo is null),
  add column if not exists nascimento date,
  add column if not exists naturalidade text;

comment on column public.profiles.sexo is
  'Sexo do cliente — usado no contrato (campo "SEXO").';
comment on column public.profiles.nascimento is
  'Data de nascimento — usado no contrato (campo "NASCIMENTO").';
comment on column public.profiles.naturalidade is
  'Cidade onde o cliente nasceu — usado no contrato (campo "NATURAL").';
