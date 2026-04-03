# Plano de Ação - Projeto Lumen

Este documento detalha a estratégia de desenvolvimento, arquitetura e funcionalidades do sistema Lumen, uma plataforma multi-tenant para gestão paroquial e automação de atendimento via WhatsApp.

---

## 1. Visão Geral
O Lumen visa modernizar a comunicação e gestão das paróquias, centralizando demandas em um quadro Kanban e automatizando processos repetitivos (batismos, dízimos, agendamentos) através de um chatbot inteligente.

---

## 2. Stack Tecnológica
*   **Frontend:** React (Vite) + TypeScript.
*   **Estilização:** Tailwind CSS + Shadcn/UI (especialmente para Dashboards e formulários).
*   **Backend & Banco de Dados:** Supabase (PostgreSQL + RLS + Edge Functions).
*   **Integração WhatsApp:** Z-API (Solução Cloud) para integração de WhatsApp por paróquia.
*   **Kanban:** `@dnd-kit/core` para drag-and-drop.

---

## 4. Identidade Visual e Branding
O projeto utiliza uma identidade visual baseada no logo oficial (`public/lumen.png`), com uma paleta de cores que reflete sobriedade e modernidade:
*   **Lumen Navy (#0F2A4A)**: Cor principal de contraste e seriedade.
*   **Lumen Teal/Blue (#2A5A83, #4A8C94)**: Cores de acento para interatividade.
*   **Lumen Gold (#D4AF37)**: Cor de destaque para elementos de atenção e status.

**Tratamento de Imagem:** 
O logo deve ser aplicado com tratamento de crop e escala (object-cover) para garantir foco nos elementos centrais da cúpula/cruz, especialmente em miniaturas e avatares.

---

## 3. Arquitetura e Segurança (Multi-tenancy)
O sistema utiliza uma arquitetura multi-tenant isolada no nível do banco de dados através de **Row Level Security (RLS)** do PostgreSQL.

*   **Identidade do Tenant:** Cada paróquia possui um `parish_id` único.
*   **Isolamento de Dados:** Usuários de uma paróquia não podem, sob nenhuma circunstância, visualizar ou editar dados de outra paróquia.
*   **Acesso Superadmin:** O Superadmin tem gestão sobre as entidades `parishes` (cadastro) e `profiles` (contas), mas as políticas de RLS garantem que ele **não visualize dados operacionais** (tasks, logs de mensagens, fluxos internos) das paróquias, mantendo a privacidade e conformidade.

---

## 4. Modelagem de Dados (Supabase)
*   `parishes`: Cadastro central das paróquias (Nome, CNPJ, Status Assinatura).
*   `profiles`: Usuários do sistema vinculados a uma paróquia ou ao sistema global (role).
*   `tasks`: Demandas do Kanban (Título, descrição, status, parish_id).
*   `whatsapp_flows`: Árvore de decisão do bot em JSON por paróquia.
*   `messages_log`: Histórico de interações para auditoria.

---

## 5. Módulos do Sistema

### Módulo 1: Gestão de Demandas (Kanban)
O "coração" operacional da secretaria.
*   Colunas customizáveis (Pendente, Em Andamento, Concluído).
*   Etiquetas por categoria (Batismo, Casamento, Dízimo).

### Módulo 2: WhatsApp & Chatbot Configurável
Diferencial competitivo para automação de atendimento.
*   Conexão via QR Code através da Z-API.
*   Interface para o secretário gerenciar credenciais e definir fluxos dinâmicos.
*   Criação automática de tarefas no Kanban baseada na conversa.

### Módulo 3: Gestão Superadmin (Módulo Administrativo Global)
Módulo exclusivo para a gestão da plataforma como um todo.
*   **Registro de Paróquias:** Criação, edição e suspensão de contas.
*   **Gestão de Instâncias API:** Centralização do cadastro de instâncias Z-API por paróquia.
*   **Métricas Globais:** Quantitativo de paróquias ativas, volume total de mensagens e usuários.
*   **Auditoria de Sistema:** Logs de acesso e alterações em configurações globais.
*   **Blindagem de Dados:** Interface de gestão que exclui acesso aos dados privados (confissões, detalhes de tarefas, histórico de chats privados).
*   **Central de Sugestões e Reports:** Local centralizado para receber feedback, sugestões de melhorias e reports de bugs enviados pelos usuários de todas as paróquias, com identificação clara do autor e da paróquia de origem.

---

## 6. Organização do Projeto
```
/src
  /components
    /ui             # Componentes base
    /kanban         # Lógica do quadro de tarefas
    /whatsapp       # Gestão de bot e chat
    /superadmin     # Componentes de gestão global
  /hooks            # Chamadas Supabase e lógica reutilizável
  /lib              # Configurações (Supabase client, Utils)
  /modules          # Lógica de negócio por domínio
    /tasks
    /chatbot
    /parochial-management
  /pages            # Rotas da aplicação (Dashboard, Kanban, Admin)
```

---

## 7. Roadmap Inicial
1.  [x] Configuração do ambiente (Vite + Tailwind + Supabase).
2.  [x] Implementação do Auth e RLS Base.
3.  [x] Desenvolvimento do Dashboard Superadmin.
4.  [x] Canal de Sugestões e Reports.
5.  [x] Implementação do Kanban básico.
6.  [x] **Organização do Quadro de Automação (Layout & UX).**
7.  [x] **Configuração da estrutura Z-API.**
8.  [x] Implementação do serviço de conexão local (QR Code & Status).
9.  [ ] Desenvolvimento do Motor de Fluxos (Engine).
10. [ ] Integração completa Chat-to-Kanban.

---

## 8. Detalhamento Técnico: Automação (Z-API)

### Passo 1: Infraestrutura API
*   **Servidor:** Plataforma de Nuvem da Z-API (SaaS).
*   **Instâncias:** Gerenciadas pelo painel da Z-API e cadastradas na plataforma localmente por paróquia via Client Token e Instance ID.

### Passo 2: Integração de Backend (Lumen Core)
*   **Services:** Implementação de `zapi.ts` para abstrair chamadas à API (Get Status, QR Code, Disconnect, SendMessage).
*   **Webhooks:** Endpoint no Supabase Edge Functions configurado no painel da Z-API para processar eventos:
    *   `on-message-received`: Captura de novas mensagens recebidas.
    *   `on-whatsapp-status`: Atualização de status da instância.

### Passo 3: Engine de Fluxos (Chatbot)
*   **Modelo de Dados:** Tabela `automation_flows` com esquema JSONB para definição de nós e arestas.
*   **Lógica de Execução:** Interpretador que identifica palavras-chave e navega pelo grafo de decisões definido pela paróquia.
*   **Acionadores de Kanban:** Implementação de hooks que chamam a API do Supabase para inserir registros em `tasks` quando um fluxo exige ação humana.
