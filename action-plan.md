# Plano de Ação - Projeto Lumen

Este documento detalha a estratégia de desenvolvimento, arquitetura e funcionalidades do sistema Lumen, uma plataforma multi-tenant para gestão paroquial e automação de atendimento via WhatsApp.

---

## 1. Visão Geral
O Lumen visa modernizar a comunicação e gestão das paróquias, centralizando demandas em um quadro Kanban e automatizando processos repetitivos (batismos, dízimos, agendamentos) através de um chatbot inteligente.

---

## 2. Stack Tecnológica
*   **Frontend:** React (Vite) + TypeScript.
*   **Estilização:** Tailwind CSS + Shadcn/UI (especialmente para Dashboards e formulários).
*   **Gerenciamento de Estado:** TanStack Query (React Query).
*   **Backend & Banco de Dados:** Supabase (PostgreSQL + RLS + Edge Functions).
*   **Integração WhatsApp:** Evolution API (Open Source) para instâncias dedicadas por paróquia.
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
*   Conexão via QR Code através da Evolution API.
*   Interface para o secretário definir fluxos dinâmicos.
*   Criação automática de tarefas no Kanban baseada na conversa.

### Módulo 3: Gestão Superadmin (Módulo Administrativo Global)
Módulo exclusivo para a gestão da plataforma como um todo.
*   **Registro de Paróquias:** Criação, edição e suspensão de instâncias paroquiais.
*   **Gestão de Instâncias API:** Monitoramento do status da Evolution API por paróquia.
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
1.  [ ] Configuração do ambiente (Vite + Tailwind + Supabase).
2.  [ ] Implementação do Auth e RLS Base.
3.  [ ] Desenvolvimento do Dashboard Superadmin (Cadastro de Paróquias, Gestão de Acessos e Central de Feedback).
4.  [ ] Canal de Sugestões e Reports (Interface do usuário e visualização admin).
5.  [ ] Implementação do Kanban básico.
6.  [ ] Integração com Evolution API e Fluxos Básicos.