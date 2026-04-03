-- Migration para a Tabela automation_sessions

-- Adicionar a coluna current_node_id para rastrear o progresso do usuário no fluxo
ALTER TABLE public.automation_sessions 
ADD COLUMN IF NOT EXISTS current_node_id TEXT;

-- Adicionar coluna metadata para guardar estados temporários se necessário futuramente
ALTER TABLE public.automation_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Garantir que last_interaction tenha um default
ALTER TABLE public.automation_sessions 
ALTER COLUMN last_interaction SET DEFAULT now();
