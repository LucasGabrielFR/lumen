# 🕯️ Lumen - Gestão Paroquial Inteligente

O **Lumen** é uma plataforma multi-tenant projetada para modernizar a gestão e comunicação interna das paróquias católicas. Integrando um quadro **Kanban** dinâmico com automação de atendimento via **WhatsApp**, o Lumen centraliza as demandas da secretaria em um fluxo inteligente e organizado.

---

## 🌟 Principais Recursos

- **🗂️ Gestão de Demandas (Kanban)**: Organize batismos, casamentos, dízimos e outras demandas em um quadro intuitivo com drag-and-drop.
- **🤖 Motor de Workflow Modular**: Chatbot de última geração com interface visual (React Flow) para automação de atendimento.
- **⚙️ Flow Engine Resiliente**: Motor de execução com tratamento de erros por nó, prevenção de loops infinitos e limpeza automática de sessões terminadas.
- **🔄 Integração com Supabase**: Sincronização em tempo real de contatos, paroquianos e sessões de atendimento.
- **⚡ Decisões Inteligentes**: Nós de If/Else (`ConditionNode`) e transbordo automático para secretaria (`HandoffNode`).
- **🛡️ Multi-tenancy (RLS)**: Isolamento completo de dados entre paróquias no nível do banco de dados através de **Row Level Security (RLS)**.
- **🎨 UI Neo-Brutalista Premium**: Interface de alto contraste, tema light absoluto, visibilidade total de controles e design técnico premium.
- **🖥️ Workspace Otimizado**: Suporte a **Modo Tela Cheia (Full-Screen)** e painel lateral de configurações de fluxo para máxima produtividade.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React v19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Edge Functions)
- **Integração WhatsApp**: [Uazapi (Global Interface)](https://docs.uazapi.com/)
- **Estado**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Roteamento**: [React Router v6](https://reactrouter.com/)

---

## 🏗️ Arquitetura de Dados

O Lumen utiliza uma estrutura robusta no **Supabase**:
- `parishes`: Entidade central com configurações de instância WhatsApp.
- `automation_flows`: Definição de grafos de fluxos Inbound (keywords) e Outbound (campanhas).
- `automation_sessions`: Gerenciamento de estado (Stateful Engine) com expiração de 2h e suporte a variáveis dinâmicas.
- `automation_messages_log`: Trilha de auditoria completa de interações inbound/outbound.
- `kanban_columns` & `kanban_tasks`: Estrutura do módulo de gestão de demandas integrada ao transbordo de automação.
- `parishioners`: Tabela primária de membros da paróquia com dados persistentes (Nome, Telefone, Email).
- `whatsapp_contacts`: Tabela de backup para contatos capturados automaticamente ou manualmente via fluxo.
- `profiles`: Extensão da autenticação com papéis (`superadmin`, `admin`, `user`).
- `parish_notes`: Sistema de lembretes rápidos por paróquia.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/LucasGabrielFR/lumen.git
cd lumen
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o ambiente:
Crie um arquivo `.env.local` na raiz com suas chaves do Supabase:
```env
VITE_SUPABASE_URL=seu-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. (Opcional) Inicie o servidor local de Webhook para a Uazapi:
Para que eventos locais do WhatsApp (como QR Code scaneado ou mensagens) sejam recebidos:
```bash
cd server
npx tsx index.ts
```
*Em seguida, será necessário usar o `ngrok` e configurar a URL nas propriedades da instância na Uazapi.*

---

## 🧭 Roadmap do Projeto

1.  [x] **Setup Inicial**: Ambiente, Auth e RLS Base.
2.  [x] **Dashboard Superadmin**: Gestão de Paróquias e Feedback.
3.  [x] **Módulo Paroquial (Admin)**: Gestão de funções e usuários da paróquia.
4.  [x] **Módulo Kanban**: Quadros dinâmicos, etiquetas e persistência de dados.
5.  [x] **Integração WhatsApp**: Provedor Global agnóstico com implementação base (`Uazapi`), webhook handler local e interpretador modular de fluxos.
6.  [x] **Workflow Engine v2**: Implementação de Nodes de Condição, Transbordo (Handoff), suporte a Botões Interativos e customização de mensagens de erro.
7.  [x] **Gestão de Contatos & UI Pro**: Busca em cascata, nó de persistência manual e suporte a variáveis condicionais avançadas. Refatoração completa para UI Neo-Brutalista (Light Theme) com visibilidade permanente de controles.
8.  [ ] **Relatórios**: Métricas de atendimento e performance da secretaria.

---

## 📄 Licença

Este projeto é desenvolvido para modernização da gestão eclesiástica. Todos os direitos reservados.

---
*Lumen: A luz que guia sua gestão paroquial.*
