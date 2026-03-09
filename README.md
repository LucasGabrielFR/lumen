# 🕯️ Lumen - Gestão Paroquial Inteligente

O **Lumen** é uma plataforma multi-tenant projetada para modernizar a gestão e comunicação interna das paróquias católicas. Integrando um quadro **Kanban** dinâmico com automação de atendimento via **WhatsApp (Evolution API)**, o Lumen centraliza as demandas da secretaria em um fluxo inteligente e organizado.

---

## 🌟 Principais Recursos

- **🗂️ Gestão de Demandas (Kanban)**: Organize batismos, casamentos, dízimos e outras demandas em um quadro intuitivo com drag-and-drop.
- **🤖 Automação WhatsApp**: Chatbot configurável que direciona atendimentos automaticamente para o Kanban.
- **🛡️ Multi-tenancy (RLS)**: Isolamento completo de dados entre paróquias no nível do banco de dados através de **Row Level Security (RLS)**.
- **📊 Portal Superadmin**: Gestão global da plataforma, controle de instâncias e monitoramento de feedback (sugestões e reports).
- **🎨 UI Moderna**: Interface premium construída com **Tailwind CSS v4**, focada em usabilidade e estética.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React v19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Edge Functions)
- **Integração WhatsApp**: [Evolution API](https://evolution-api.com/)
- **Estado**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Roteamento**: [React Router v6](https://reactrouter.com/)

---

## 🏗️ Arquitetura de Dados

O Lumen utiliza uma estrutura robusta no **Supabase**:
- `parishes`: Entidade central das instituições cadastradas.
- `profiles`: Extensão da autenticação com papéis (`superadmin`, `admin`, `user`).
- `feedback`: Canal de escuta ativa para melhorias contínuas.
- *(Próximos)* `tasks`, `whatsapp_flows`, `messages_log`.

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

---

## 🧭 Roadmap do Projeto

1.  [x] **Setup Inicial**: Ambiente, Auth e RLS Base.
2.  [x] **Dashboard Superadmin**: Gestão de Paróquias e Feedback.
3.  [ ] **Módulo Paroquial (Admin)**: Gestão de funções e usuários da paróquia.
4.  [ ] **Módulo Kanban**: Quadros dinâmicos e etiquetas.
5.  [ ] **Integração WhatsApp**: Conexão Evolution API e fluxos de bot.
6.  [ ] **Relatórios**: Métricas de atendimento e performance da secretaria.

---

## 📄 Licença

Este projeto é desenvolvido para modernização da gestão eclesiástica. Todos os direitos reservados.

---
*Lumen: A luz que guia sua gestão paroquial.*
