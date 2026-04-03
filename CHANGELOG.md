# Changelog - Projeto Lumen

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0-beta] - 2026-04-03

### Added
- **Motor de Variáveis (v2.0)**: Implementação de resolução recursiva de variáveis (permite aninhar placeholders como `{{{{VAR}}}}`).
- **Resiliência de Extração**: Novo algoritmo de limpeza que ignora parênteses `()`, colchetes `[]` e espaços acidentais dentro das chaves, tornando o motor "à prova de erros".
- **Busca Case-Insensitive**: O interpretador agora ignora a diferença entre maiúsculas e minúsculas para TODAS as variáveis (ex: `{{NOME}}` e `{{nome}}` são a mesma chave).
- **Variáveis de Sistema**: Adição automática das variáveis `{{data_atual}}` e `{{hora_atual}}` em todos os fluxos.
- **Gestão de Keywords Integrada**: Migração da configuração de palavras-chave (Keywords) do menu lateral externo para o `SettingsDrawer` interno do FlowBuilder, unificando a configuração do fluxo em um único local.
- **Modo Tela Total (Canvas Expanded)**: Estratégia de layout na `FlowsPage` que remove as colunas laterais, permitindo que o editor de fluxos ocupe 100% da largura da tela.
- **Sanitização de Nomes**: O motor agora remove automaticamente as chaves `{{}}` caso o usuário as digite no campo "Nome da Variável", garantindo integridade no banco de dados.

### Removed
- **Barra Lateral de Etapas**: Remoção definitiva da barra lateral esquerda de "Etapas do Chat" e "Acionadores" na página de fluxos para reduzir a carga cognitiva e priorizar a visualização do grafo.

### Changed
- **Layout da FlowsPage**: Refatoração do grid layout de 4 colunas para um flex layout de largura total, otimizando drasticamente o espaço útil para o FlowBuilder.
- **Localização PT-BR**: Tradução completa da interface do FlowBuilder e todos os seus 11 tipos de nós para Português (Brasil), garantindo uma experiência nativa para os secretários paroquiais.
- **Integração de Notificações (Toasts)**: Substituição de `alert()` por `toast.success()` e `toast.error()` via `sonner` para feedback de disparos de teste e salvamento.
- **Configurações de Teste Integradas**: Migração do campo de número de teste do cabeçalho da página para o painel de configurações interno do FlowBuilder, centralizando a experiência de depuração.

### Fixed
- **Inconsistência de Variáveis**: Corrigido o problema onde variáveis copiadas via `SetVariableNode` permaneciam como strings literais.
- **Lookup de Condição**: Corrigida a falha na `Lógica Condicional` que impedia encontrar variáveis definidas com nomes em caixa diferente (Maiúsculo vs Minúsculo).
- **Recursividade no WhatsApp**: Resolvido bug onde mensagens mostravam o placeholder da segunda variável em vez do valor original.
- Corrigido travamento no nó de busca de contato (`findContactNode`) ao utilizar `.maybeSingle()` e tratar retornos vazios graciosamente.
- Melhorado o tratamento de erros e logs no nó de salvamento de contato (`saveContactNode`).
- Adicionado isolamento de erros (`try/catch`) por nó para evitar falhas silenciosas em todo o motor de execução.
- **Loop Infinito**: Resolvido problema onde o motor entrava em loop se um `optionNode` (ou qualquer nó) não tivesse uma conexão de saída. Agora o sistema auto-finaliza a sessão e limpa o estado.
- **Estabilidade do BD**: Substituído `.single()` por `.maybeSingle()` em consultas de contato para evitar erros fatais (PGRST116).
- **Tratamento de Erros**: Implementado bloco `try/catch` global no processamento de nós, garantindo que falhas individuais não derrubem o serviço.

### Changed
- **Interface de Cabeçalho**: Simplificação do header da página de fluxos, removendo controles redundantes e priorizando o espaço de edição.
- **Limpeza de Código**: Remoção de importações não utilizadas e correção de avisos de lint nos componentes principais.
- **UI Neo-Brutalista Técnica**: Refatoração completa da interface do FlowBuilder para um tema Light permanente de alto contraste.
- **Visibilidade Permanente**: Todos os botões de ação (excluir nó, adicionar opção, remover opção) agora são visíveis permanentemente, eliminando a dependência de interações `hover` para acessibilidade.
- **Neo-Brutalism Design/Light Theme**: Padronização de bordas (`border-2`), cantos vivos (`rounded-none`) e sombras sólidas (`shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]`) em todos os 11 componentes de nós. Remoção agressiva de classes de modo escuro (`dark:`).
- **Modo Tela Cheia (Full-Screen)**: Adição de funcionalidade de expansão do canvas para ocupar 100% da viewport, otimizando o espaço de trabalho para fluxos complexos.
- **Painel de Configurações (Settings Drawer)**: Implementação de um menu lateral de configurações do fluxo, permitindo gerenciar o status de ativação (`Ativo/Pausado`) diretamente no editor.

- **Nó de Busca de Contato (FindContactNode)**: Implementação de busca em cascata (Paroquianos > Contatos WhatsApp) para identificação automática de clientes no início ou meio do fluxo.
- **Nó de Salvar Contato (SaveContactNode)**: Permite a persistência manual de dados capturados (como nome) na tabela de contatos de backup (`whatsapp_contacts`).
- **Lógica de Condição (Advanced)**: O `ConditionNode` agora suporta a validação de variáveis específicas (ex: `{{paroquiano_existe}}`) além do último input do usuário, e inclui suporte a **Expressões Regulares (Regex)**.
- **Gestão de Contatos (DB)**: Criação das tabelas `parishioners` e `whatsapp_contacts` com suporte a RLS e indexação por telefone para performance.
- **Nó de Início (StartNode)**: Adição de um ponto de entrada explícito para os fluxos, facilitando a organização visual e garantindo uma execução determinística.
- **Nó de Pergunta/Input (InputNode)**: Novo nó que envia uma mensagem, pausa o fluxo e captura a próxima resposta do usuário em uma variável customizável (ex: `{{nome_cliente}}`).
- **Nó de Aguardar (WaitNode)**: Implementação de pausa simples em segundos entre os passos do fluxo para criar cadência na conversa.
- **Nó de Atribuição (SetVariableNode)**: Permite definir valores para variáveis de sessão manualmente (ex: `status = "lead"`) sem depender de input do usuário.
- **Conexões Deletáveis**: Introdução de um botão de exclusão visual (ícone "X") em cada link entre nós ao selecionar ou passar o mouse, facilitando a reestruturação do fluxo.
- **Suporte a Variáveis Dinâmicas**: O interpretador agora permite o uso de qualquer variável capturada anteriormente em mensagens subsequentes, utilizando a sintaxe `{{variavel}}`.
- **Melhoria no Nó de Opções (OptionNode)**: Adição de uma saída "Padrão" (*Default*) para tratar casos onde o usuário envia uma resposta que não coincide com nenhuma das opções listadas.
- **Customização de Erro no Menu**: Inclusão do campo "Mensagem de Erro (Opção Inválida)" no `OptionNode`, permitindo definir uma resposta personalizada (com suporte a variáveis) caso o usuário não escolha uma opção válida.
- **Log de Diagnóstico de Webhooks**: Inclusão do corpo completo da mensagem no log do console quando o remetente não é identificado, facilitando a depuração de novos formatos de payload.
- **Identificação de Remetente Resiliente**: Adição do campo `from` na busca por identificação de remetente no webhook, garantindo compatibilidade com o formato Uazapi V2.
- **Uazapi Provider v2.2**: Migração completa para endpoints `/send/text` e `/send/menu`. Correção do cabeçalho de autenticação para `token` (anteriormente `apikey`) e achatamento (*flattening*) do payload JSON para conformidade com a especificação v2.
- **Nó de Encerramento (EndNode)**: Finalização explícita da conversa com envio de mensagem de despedida customizável.
- **Modal de Confirmação de Exclusão**: Interface de validação antes de remover qualquer nó no FlowBuilder.
- **Interface de Edição Estável**: Implementação de classes `nodrag` e `nopan` para permitir digitação fluida em campos de texto dentro dos nós.
- **Logs de Diagnóstico**: Rastreamento detalhado de keywords, matching de fluxos e status de execução no servidor.
- **Matching Robusto**: Lógica aprimorada para gatilhos de fluxo, incluindo suporte confiável ao curinga `*`.
- **Nó de Condição (Re-vamp)**: Layout de handles revisado com saídas "Sim (Verdadeiro)" e "Não (Falso)" com ícones distintivos (Check/X) e cores reforçadas para melhor clareza.
- **Sincronização de WhatsApp**: Adição de botão para sincronizar credenciais da instância (token e instance_id) do Uazapi para o banco de dados Supabase.
- **Uazapi Provider v2.1**: Parsing aprimorado para respostas da API, suportando dados aninhados em campos 'instance' para garantir sincronização sem erros.

### Fixed
- **Instabilidade no Webhook**: Correção de `TypeError` ao acessar o corpo da requisição sem validação prévia.
- **Detecção de Parish ID**: Fallback automático para `whatsapp_instance_id` caso o `id` não seja encontrado diretamente no payload.
- **Processamento de Lote**: Mudança de `return` para `continue` no loop de mensagens do webhook, garantindo que todas as mensagens em um único payload sejam processadas.
- Bloqueio de interação em campos de input e select no FlowBuilder (fix via Keyboard Event Propagation).
- Atribuição de handlers de delete em novos nós criados via menu lateral.
- Registro visual do nó de condição para diferenciar claramente os caminhos Verdadeiro (SIM) e Falso (NÃO).
- **Lógica de Condição**: O interpretador agora utiliza o contexto global de input (`last_input`) para avaliações de condição, garantindo consistência em fluxos encadeados.
- **Persistência de Estado**: Correção na gravação de variáveis de sessão no banco de dados durante a execução do fluxo.

### Changed
- **Migração de Colunas**: Substituição definitiva de colunas `zapi_` por `whatsapp_` (`whatsapp_token`, `whatsapp_instance_id`, `whatsapp_connected`) na tabela `parishes`.
- **Sincronização Automática**: O sistema agora salva automaticamente os dados de instância (`token` e `instance_id`) no banco de dados assim que uma instância é criada ou conectada.
- **Refatoração do Servidor**: Migração da lógica de execução para uma estrutura de classes/objetos (`Interpreter.ts`).
- **OptionNode v2**: Permite alternar entre formato de "Lista" e "Botões" diretamente no editor.
- **Gerenciamento de Sessão**: Adição da coluna `variables` (JSONB) em `automation_sessions` para manter o estado do usuário.
- **Expiração de Sessão**: Ajuste na lógica de timeout para 2 horas após a última interação.
- **Type Safety**: Atualização dos tipos globais do banco de dados para refletir as mudanças no schema.

### Fixed
- Tratamento de erros na inicialização de instâncias do WhatsApp.
- Validação visual de máscaras de telefone para evitar envios incorretos ao provedor.

## [0.2.0-beta] - 2026-03-09

### Added
- **Módulo Paroquial**: Dashboard dedicado, Sidebar dinâmica e identificação automática.
- **Sticky Notes**: Lembretes rápidos com persistência e cores customizáveis.
- **Módulo Kanban**: Quadro completo com Drag-and-Drop, colunas e tarefas vinculadas à paróquia.
- **Sistema de Alertas**: Notificações em tempo real (Realtime) para transbordo de atendimento.

### Removed
- Gestão manual de tokens na interface, centralizado agora no serviço global Lumen.
