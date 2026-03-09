# Changelog - Projeto Lumen

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2026-03-07

### Adicionado
- **Arquitetura Base**: Configuração inicial com Vite, React, TypeScript e Tailwind CSS v4.
- **Multi-tenancy**: Implementação de Row Level Security (RLS) no Supabase para isolamento de dados por paróquia.
- **Autenticação**: Sistema de login com `AuthContext` e suporte a múltiplos papéis (`superadmin`, `admin`, `user`).
- **Portal Superadmin**:
  - Layout customizado com Sidebar e navegação protegida.
  - Tela de Gestão de Paróquias: Cadastro de instituições e criação de acessos administrativos.
  - Central de Sugestões & Reports: Painel para monitoramento de feedbacks dos usuários.
- **Design System**: Tipografia `Outfit` e paleta de cores personalizada com HSL.
- **Plano de Ação**: Documento `action-plan.md` detalhando a visão e roadmap do projeto.

---
*Lumen: Modernizando a comunicação e gestão paroquial.*
