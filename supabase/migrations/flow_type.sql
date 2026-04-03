-- Migration para a Tabela automation_flows do Workflow Engine

-- Passo 1: Criar o tipo de Enumeração caso não exista
DO $$ BEGIN
    CREATE TYPE flow_type AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Passo 2: Adicionar a coluna `type` e estabelecer fallback/default
ALTER TABLE public.automation_flows 
ADD COLUMN IF NOT EXISTS type flow_type DEFAULT 'inbound';

-- (Opcional) Passo 3: Atualizar tipos TypeScript locais gerando novos tipos
-- supabase gen types typescript --project-id SEU_PROJETO > src/types/database.ts
