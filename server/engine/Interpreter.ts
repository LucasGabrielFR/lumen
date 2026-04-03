import { SupabaseClient } from '@supabase/supabase-js';
import { IWhatsAppProvider } from '../providers/WhatsAppProvider';

export class FlowInterpreter {
  private supabase: SupabaseClient;
  private provider: IWhatsAppProvider;

  constructor(supabase: SupabaseClient, provider: IWhatsAppProvider) {
    this.supabase = supabase;
    this.provider = provider;
  }

  // Helper to replace variables (supports both {{var}} and [[var]])
  private processVariables(text: string, context: Record<string, any>, depth = 0): string {
    if (!text || depth > 3) return text || '';
    
    const result = text.toString().replace(/\{\{(.*?)\}\}|\[\[(.*?)\]\]/g, (match, p1, p2) => {
      // Clean the key aggressively: trim spaces and remove surrounding parentheses or extra braces
      const rawKey = (p1 || p2).trim();
      const key = rawKey.replace(/[(){}[\]]/g, '').trim().toLowerCase();
      
      if (!key) return match;

      // Look for key in context (case-insensitive)
      const actualKey = Object.keys(context).find(k => k.toLowerCase() === key);
      const value = actualKey ? context[actualKey] : undefined;
      
      if (value !== undefined) {
        return String(value);
      }
      return match;
    });

    // If change occurred and we still have delimiters, try one more level (recursive)
    if (result !== text && (result.includes('{{') || result.includes('[['))) {
      return this.processVariables(result, context, depth + 1);
    }

    return result;
  }

  // Helper to resolve a value (could be a literal, a single variable, or a template)
  private resolveValue(val: any, context: Record<string, any>): any {
    if (typeof val !== 'string') return val;
    const text = val.trim();
    
    // Check if it's EXACTLY a single variable placeholder (e.g. {{var}})
    const singleVarMatch = text.match(/^\{\{(.*?)\}\}$|^\[\[(.*?)\]\]$/);
    if (singleVarMatch) {
      const rawKey = (singleVarMatch[1] || singleVarMatch[2]).trim();
      // Clean key: remove parentheses and other fluff
      const key = rawKey.replace(/[(){}[\]]/g, '').trim().toLowerCase();
      
      const actualKey = Object.keys(context).find(k => k.toLowerCase() === key);
      
      if (actualKey && context[actualKey] !== undefined) {
        const result = context[actualKey];
        // If the resulting value is ALSO a variable string, resolve it recursively
        if (typeof result === 'string' && (result.startsWith('{{') || result.startsWith('[['))) {
           return this.resolveValue(result, context);
        }
        return result;
      }
    }

    // Otherwise, treat as a string template
    return this.processVariables(text, context);
  }

  // Helper to sanitize variable names (remove {{ }} if present)
  private sanitizeVarName(name: string): string {
    if (!name) return '';
    return name.replace(/\{\{|\}\}/g, '').trim();
  }

  // Create Kanban Task helper
  private async createHandoffTask(parishId: string, phone: string, contactName: string, metadata: any) {
    // 1. Get first column for this parish
    const { data: column } = await this.supabase
      .from('kanban_columns')
      .select('id')
      .eq('parish_id', parishId)
      .order('order', { ascending: true })
      .limit(1)
      .single();

    if (!column) return;

    // 2. Create task
    const { error } = await this.supabase
      .from('kanban_tasks')
      .insert([{
        parish_id: parishId,
        column_id: column.id,
        title: `Atendimento WhatsApp: ${contactName || phone}`,
        description: `Contato: ${phone}\nFluxo Encerrado. Detalhes: ${JSON.stringify(metadata)}`,
        order: 0,
        tags: ['WhatsApp', 'Handoff']
      }]);
    
    if (error) console.error('Error creating handoff task:', error);
  }

  // Log execution helper
  private async logExecution(parishId: string, sessionId: string, flowId: string, node: any, direction: 'inbound' | 'outbound', content: string) {
    await this.supabase
      .from('automation_messages_log')
      .insert([{
        parish_id: parishId,
        session_id: sessionId,
        flow_id: flowId,
        node_id: node.id,
        node_type: node.type,
        direction,
        content,
        metadata: node.data || {}
      }]);
  }

  // Metric tracking helper
  public async trackMetric(parishId: string, flowId: string, metricType: string, metadata: any = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.supabase
        .from('flow_analytics_metrics')
        .select('id, count')
        .eq('parish_id', parishId)
        .eq('flow_id', flowId)
        .eq('metric_type', metricType)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        await this.supabase
          .from('flow_analytics_metrics')
          .update({ 
            count: (data.count || 0) + 1,
            metadata: { ...(data.metadata || {}), ...metadata }
          })
          .eq('id', data.id);
      } else {
        await this.supabase
          .from('flow_analytics_metrics')
          .insert([{
            parish_id: parishId,
            flow_id: flowId,
            metric_type: metricType,
            date: today,
            count: 1,
            metadata
          }]);
      }
    } catch (err) {
      console.error(`[Metrics] Error tracking ${metricType}:`, err);
    }
  }

  private async saveSessionState(sessionId: string, nodeId: string, updates: any = {}) {
    await this.supabase
      .from('automation_sessions')
      .update({ 
        current_node_id: nodeId,
        last_interaction: new Date().toISOString(),
        ...updates
      })
      .eq('id', sessionId);
  }

  async execute(parishId: string, phone: string, flow: any, session: any, incomingMessage?: string) {
    const { nodes, edges } = flow.flow_data || { nodes: [], edges: [] };
    let currentNodeId = session.current_node_id;
    let hasMoreSteps = true;

    // Context for variables
    const { data: parish } = await this.supabase.from('parishes').select('name').eq('id', parishId).single();
    const now = new Date();
    const context = {
      parish_name: parish?.name || '',
      contact_name: session.metadata?.name || 'Cliente',
      last_input: incomingMessage || '',
      phone: phone,
      data_atual: now.toLocaleDateString('pt-BR'),
      hora_atual: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      ...(session.variables || {}) // Merge stored variables into context
    };

    // Track Session Start if it's the beginning
    if (!currentNodeId && !session.call_stack?.length) {
      await this.trackMetric(parishId, flow.id, 'session_started');
    }

    // If no node set, start with the root node
    if (!currentNodeId) {
      console.log(`Interpreter: Procurando nó inicial no fluxo ${flow.name}...`);
      // 1. Try to find an explicit startNode
      let rootNode = nodes.find((n: any) => n.type === 'startNode');
      
      // 2. Fallback: A node with no incoming edges
      if (!rootNode) {
        rootNode = nodes.find((n: any) => !edges.some((e: any) => e.target === n.id));
      }

      if (rootNode) {
        currentNodeId = rootNode.id;
        console.log(`Interpreter: Nó de entrada encontrado: ${currentNodeId} (${rootNode.type})`);
      } else {
        console.warn("Could not find a root node in the flow. Nodes:", nodes.length, "Edges:", edges.length);
        return;
      }
    }

    while (hasMoreSteps) {
      const currentNode = nodes.find((n: any) => n.id === currentNodeId);
      if (!currentNode) {
        console.warn(`Interpreter: Node ${currentNodeId} not found in nodes list.`);
        break;
      }

      try {
        console.log(`Interpreter: EXECUTANDO NÓ [${currentNode.type}] - ID: ${currentNode.id}`);

      // === TYPE: startNode ===
      if (currentNode.type === 'startNode') {
        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        } else {
          hasMoreSteps = false;
        }
      }

      // === TYPE: messageNode ===
      else if (currentNode.type === 'messageNode') {
        let text = currentNode.data?.text || '';
        if (text) {
          text = this.processVariables(text, context);
          await this.provider.sendMessage(phone, text);
          await this.logExecution(parishId, session.id, flow.id, currentNode, 'outbound', text);
        }

        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          incomingMessage = undefined; // IMPORTANT: Prevent trigger text from leaking to the next nodes
          continue;
        } else {
          console.log(`Interpreter: Fim do fluxo atingido no nó ${currentNodeId}`);
          await this.supabase.from('automation_sessions').delete().eq('id', session.id);
          hasMoreSteps = false;
        }
      }

      // === TYPE: optionNode ===
      else if (currentNode.type === 'optionNode') {
        const options = currentNode.data?.options || [];
        const displayType = currentNode.data?.displayType || 'list';

        if (!incomingMessage) {
          let text = this.processVariables(currentNode.data?.text || 'Escolha uma opção:', context);
          
          if (displayType === 'buttons' && options.length <= 3) {
            await this.provider.sendButtons(phone, text, options.map((o: any) => ({ id: o.id, label: o.label })));
          } else {
            // Text list format
            if (options.length > 0) {
              text += "\n\n" + options.map((o: any, idx: number) => `*${idx + 1}.* ${o.label}`).join('\n');
            }
            await this.provider.sendMessage(phone, text);
          }

          await this.logExecution(parishId, session.id, flow.id, currentNode, 'outbound', text);
          
          await this.saveSessionState(session.id, currentNodeId);
          hasMoreSteps = false;
        } 
        else {
          const normalizedMsg = incomingMessage.trim().toLowerCase();
          const matchedOption = options.find((o: any, idx: number) => {
            return normalizedMsg === (idx + 1).toString() || normalizedMsg === o.label.toLowerCase();
          });

          if (matchedOption) {
            const nextEdge = edges.find((e: any) => e.source === currentNodeId && (e.sourceHandle === matchedOption.id || e.sourceHandle === null));
            if (nextEdge) {
              currentNodeId = nextEdge.target;
              incomingMessage = undefined; // Process next node as fresh
              continue;
            } else {
              console.log(`Interpreter: Fim do fluxo atingido via opção no nó ${currentNodeId}`);
              await this.supabase.from('automation_sessions').delete().eq('id', session.id);
              hasMoreSteps = false;
            }
          } else {
            console.log(`Interpreter: Opção inválida recebida: ${incomingMessage}. Buscando fallback...`);
            // Check for 'default' handle
            const defaultEdge = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === 'default');
            if (defaultEdge) {
              currentNodeId = defaultEdge.target;
              incomingMessage = undefined;
              continue;
            }

            const invalidMsg = this.processVariables(
              currentNode.data?.invalidMessage || "Desculpe, não entendi a opção escolhida. Por favor, escolha uma das opções acima.",
              context
            );
            await this.provider.sendMessage(phone, invalidMsg);
            hasMoreSteps = false;
          }
        }
      }

      // === TYPE: inputNode ===
      else if (currentNode.type === 'inputNode') {
        if (!incomingMessage) {
            console.log(`[Flow] InputNode: Sem mensagem recebida. Enviando pergunta...`);
            let text = this.processVariables(currentNode.data?.text || 'Por favor, envie sua resposta:', context);
            
            try {
              console.log(`[Flow] InputNode: Enviando para ${phone}: "${text.substring(0, 20)}..."`);
              await this.provider.sendMessage(phone, text);
              console.log(`[Flow] InputNode: Pergunta enviada com sucesso.`);
              
              await this.logExecution(parishId, session.id, flow.id, currentNode, 'outbound', text);
              await this.saveSessionState(session.id, currentNodeId);
              console.log(`[Flow] InputNode: Estado da sessão salvo. Aguardando resposta.`);
              hasMoreSteps = false;
            } catch (err) {
              console.error(`[Flow] ERROR in InputNode sendMessage:`, err);
              hasMoreSteps = false;
            }
        } else {
            console.log(`[Flow] InputNode: Resposta recebida: "${incomingMessage}"`);
            // Save input to variable
            const varName = this.sanitizeVarName(currentNode.data?.variableName || 'input');
            const updatedVariables = { ...(session.variables || {}), [varName]: incomingMessage };
            
            console.log(`[Flow] InputNode: Salvando variável "${varName}" = "${incomingMessage}"`);
            await this.supabase.from('automation_sessions').update({ 
                variables: updatedVariables,
                last_interaction: new Date().toISOString()
            }).eq('id', session.id);

            // Update local session object for recursive execution
            session.variables = updatedVariables;
            context[varName] = incomingMessage;

            const nextEdge = edges.find((e: any) => e.source === currentNode.id);
            if (nextEdge) {
                console.log(`[Flow] InputNode: Seguindo para próximo nó: ${nextEdge.target}`);
                currentNodeId = nextEdge.target;
                incomingMessage = undefined;
                continue;
            } else {
                console.log(`[Flow] InputNode: Nenhum próximo nó encontrado. Finalizando.`);
                await this.supabase.from('automation_sessions').delete().eq('id', session.id);
                hasMoreSteps = false;
            }
        }
      }

      // === TYPE: conditionNode ===
      else if (currentNode.type === 'conditionNode') {
        const rule = currentNode.data?.rule || 'contains';
        const value = (currentNode.data?.value || '').toLowerCase().trim();
        const varName = this.sanitizeVarName(currentNode.data?.variableName);
        
        let textToCompare = context.last_input || '';
        if (varName) {
           const key = varName.toLowerCase();
           const actualKey = Object.keys(context).find(k => k.toLowerCase() === key);
           const varVal = actualKey ? context[actualKey] : undefined;
           textToCompare = varVal !== undefined ? String(varVal) : '';
        }

        const msgToCheck = textToCompare.toLowerCase().trim();

        let result = false;
        if (rule === 'contains') result = msgToCheck.includes(value);
        else if (rule === 'equals') result = msgToCheck === value;
        else if (rule === 'not_contains') result = !msgToCheck.includes(value);
        else if (rule === 'regex') {
          try {
            const regex = new RegExp(value, 'i');
            result = regex.test(msgToCheck);
          } catch (e) {
            console.error('Invalid regex in conditionNode:', value);
            result = false;
          }
        }

        const handleId = result ? 'true' : 'false';
        const nextEdge = edges.find((e: any) => e.source === currentNode.id && e.sourceHandle === handleId);
        
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          incomingMessage = undefined;
          continue;
        } else {
          console.log(`Interpreter: Fim do fluxo atingido via condição no nó ${currentNodeId}`);
          await this.supabase.from('automation_sessions').delete().eq('id', session.id);
          hasMoreSteps = false;
        }
      }

      // === TYPE: findContactNode ===
      else if (currentNode.type === 'findContactNode') {
        const varName = this.sanitizeVarName(currentNode.data?.variableName || 'paroquiano_existe');
        console.log(`[Flow] findContactNode: Buscando ${phone} para paróquia ${parishId}...`);
        
        // 1. Search in parishioners
        const { data: parishioner, error: pError } = await this.supabase
          .from('parishioners')
          .select('name')
          .eq('parish_id', parishId)
          .eq('phone', phone)
          .maybeSingle();

        if (pError) console.error(`[Flow] Error searching parishioners:`, pError);

        let found = false;
        let foundName = '';

        if (parishioner) {
          found = true;
          foundName = parishioner.name;
          console.log(`[Flow] findContactNode: Paroquiano encontrado: ${foundName}`);
        } else {
          console.log(`[Flow] findContactNode: Paroquiano não encontrado. Buscando em contatos backup...`);
          // 2. Search in whatsapp_contacts
          const { data: contact, error: cError } = await this.supabase
            .from('whatsapp_contacts')
            .select('name')
            .eq('parish_id', parishId)
            .eq('phone', phone)
            .maybeSingle();
          
          if (cError) console.error(`[Flow] Error searching backup contacts:`, cError);

          if (contact) {
            found = true;
            foundName = contact.name || '';
            console.log(`[Flow] findContactNode: Contato backup encontrado: ${foundName}`);
          } else {
            console.log(`[Flow] findContactNode: Nenhum registro encontrado para ${phone}.`);
          }
        }

        // Save results to variables
        const variables = { 
          ...(session.variables || {}), 
          [varName]: found,
          'nome_encontrado': foundName
        };
        
        session.variables = variables;
        context[varName] = found;
        context['nome_encontrado'] = foundName;

        await this.saveSessionState(session.id, currentNode.id, { variables });

        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        console.log(`Interpreter: Fim do fluxo atingido no nó findContactNode`);
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: saveContactNode ===
      else if (currentNode.type === 'saveContactNode') {
        const nameVar = this.sanitizeVarName(currentNode.data?.nameVariable || 'nome_cliente');
        const nameToSave = context[nameVar] || 'Contato Desconhecido';
        
        console.log(`[Flow] saveContactNode: Salvando ${phone} (${nameToSave}) na base de backup...`);
        
        const { error } = await this.supabase
          .from('whatsapp_contacts')
          .upsert({
            parish_id: parishId,
            phone: phone,
            name: nameToSave,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'parish_id, phone' 
          });

        if (error) {
          console.error('[Flow] Error in saveContactNode upsert:', error);
        } else {
          console.log('[Flow] saveContactNode: Contato salvo/atualizado com sucesso.');
        }

        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        console.log(`Interpreter: Fim do fluxo atingido no nó saveContactNode`);
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: waitNode ===
      else if (currentNode.type === 'waitNode') {
        const seconds = currentNode.data?.seconds || 0;
        if (seconds > 0) {
          console.log(`[Flow] Waiting ${seconds} seconds...`);
          await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        }
        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        console.log(`Interpreter: Fim do fluxo atingido no nó waitNode`);
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: setVariableNode ===
      else if (currentNode.type === 'setVariableNode') {
        const varName = this.sanitizeVarName(currentNode.data?.variableName);
        const rawValue = currentNode.data?.variableValue;
        
        if (varName) {
          const resolvedValue = this.resolveValue(rawValue, context);
          
          const variables = session.variables || {};
          variables[varName] = resolvedValue;
          session.variables = variables;
          await this.saveSessionState(session.id, currentNode.id, { variables });
          context[varName] = resolvedValue;
          console.log(`[Flow] Set variable ${varName} = ${resolvedValue} (Type: ${typeof resolvedValue})`);
        }

        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        console.log(`Interpreter: Fim do fluxo atingido no nó setVariableNode`);
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: handoffNode ===
      else if (currentNode.type === 'handoffNode') {
        let text = currentNode.data?.text || 'Seu atendimento foi encaminhado para um de nossos secretários.';
        text = this.processVariables(text, context);
        
        await this.provider.sendMessage(phone, text);
        await this.logExecution(parishId, session.id, flow.id, currentNode, 'outbound', text);
        await this.trackMetric(parishId, flow.id, 'handoff');
        
        // Create Kanban task
        await this.createHandoffTask(parishId, phone, context.contact_name, {
            last_input: context.last_input,
            flow_name: flow.name
        });

        // Delete session as the automation ends here
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: endNode ===
      else if (currentNode.type === 'endNode') {
        let text = currentNode.data?.text || 'Obrigado pelo seu contato! O atendimento foi encerrado.';
        text = this.processVariables(text, context);
        
        await this.provider.sendMessage(phone, text);
        await this.logExecution(parishId, session.id, flow.id, currentNode, 'outbound', text);
        await this.trackMetric(parishId, flow.id, 'session_completed');
        
        // Handle Return from Sub-flow
        const callStack = session.call_stack || [];
        if (callStack.length > 0) {
          const lastCall = callStack.pop();
          console.log(`[Flow] Sub-flow ended. Returning to ${lastCall.flow_id} at node ${lastCall.return_node_id}`);
          
          const { data: parentFlow } = await this.supabase
            .from('automation_flows')
            .select('*')
            .eq('id', lastCall.flow_id)
            .single();

          if (parentFlow) {
            // Update session state before resuming
            await this.saveSessionState(session.id, lastCall.return_node_id, { 
              current_flow_id: parentFlow.id,
              call_stack: callStack 
            });

            if (lastCall.return_node_id) {
              currentNodeId = lastCall.return_node_id;
              // Continue directly to the return node in the parent flow
              const updatedSession = { ...session, current_node_id: lastCall.return_node_id, current_flow_id: parentFlow.id, call_stack: callStack };
              return this.execute(parishId, phone, parentFlow, updatedSession);
            }
          }
        }

        // Delete session to end automation
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      // === TYPE: subFlowNode ===
      else if (currentNode.type === 'subFlowNode') {
        const subFlowId = currentNode.data?.subFlowId;
        const nextEdge = edges.find((e: any) => e.source === currentNode.id);

        if (!subFlowId) {
          console.warn(`[Flow] subFlowNode: No subFlowId specified.`);
          if (nextEdge) {
            currentNodeId = nextEdge.target;
            continue;
          }
          hasMoreSteps = false;
          break;
        }

        const { data: subFlow } = await this.supabase
          .from('automation_flows')
          .select('*')
          .eq('id', subFlowId)
          .single();

        if (!subFlow) {
          console.warn(`[Flow] subFlowNode: Sub-flow ${subFlowId} not found.`);
          if (nextEdge) {
            currentNodeId = nextEdge.target;
            continue;
          }
          hasMoreSteps = false;
          break;
        }

        // Push current to stack
        const callStack = session.call_stack || [];
        callStack.push({
          flow_id: flow.id,
          return_node_id: nextEdge ? nextEdge.target : null
        });

        console.log(`[Flow] Calling Sub-flow: ${subFlow.name}. Stack depth: ${callStack.length}`);
        
        await this.saveSessionState(session.id, null, {
          current_flow_id: subFlow.id,
          call_stack: callStack
        });

        const updatedSession = { ...session, current_node_id: null, current_flow_id: subFlow.id, call_stack: callStack };
        return this.execute(parishId, phone, subFlow, updatedSession);
      }

      // === TYPE: businessHoursNode ===
      else if (currentNode.type === 'businessHoursNode') {
        console.log(`[Flow] Executing businessHoursNode...`);
        const schedule = currentNode.data?.schedule || {};
        
        const nowInParish = new Date();
        const dayKey = nowInParish.getDay().toString(); // Use numeric string (0-6)
        const dayConfig = schedule[dayKey] || { active: false };

        let isOpen = false;
        if (dayConfig.active) {
          const currentTime = nowInParish.getHours() * 60 + nowInParish.getMinutes();
          const [startH, startM] = (dayConfig.start || "08:00").split(':').map(Number);
          const [endH, endM] = (dayConfig.end || "18:00").split(':').map(Number);
          
          const startTime = startH * 60 + startM;
          const endTime = endH * 60 + endM;
          
          if (currentTime >= startTime && currentTime <= endTime) {
            isOpen = true;
          }
        }

        console.log(`[Flow] Business Hours check for day ${dayKey}: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        const handleId = isOpen ? 'open' : 'closed'; // Use 'open'/'closed' handles from UI
        const nextEdge = edges.find((e: any) => e.source === currentNode.id && e.sourceHandle === handleId);

        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        hasMoreSteps = false;
      }

      // === TYPE: taggingNode ===
      else if (currentNode.type === 'taggingNode') {
        const tags = currentNode.data?.tags || []; // Use 'tags' array from UI
        const topic = currentNode.data?.topic;
        
        console.log(`[Flow] taggingNode: Processing tags [${tags.join(', ')}] and topic "${topic}" for ${phone}`);
        
        // 1. Get current tags
        const { data: contact } = await this.supabase
          .from('whatsapp_contacts')
          .select('tags')
          .eq('parish_id', parishId)
          .eq('phone', phone)
          .maybeSingle();

        let currentTags = contact?.tags || [];
        
        // Add new tags that aren't already present
        tags.forEach((tag: string) => {
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
          }
        });

        // 2. Update DB with tags and optional topic
        await this.supabase
          .from('whatsapp_contacts')
          .update({ 
             tags: currentTags,
             ...(topic ? { last_topic: topic } : {})
          })
          .eq('parish_id', parishId)
          .eq('phone', phone);

        const nextEdge = edges.find((e: any) => e.source === currentNode.id);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
          continue;
        }
        hasMoreSteps = false;
      }

      else {
        console.warn(`Interpreter: Tipo de nó não reconhecido: ${currentNode.type}. Finalizando sessão por segurança.`);
        
        // Final fallback: try to return from subflow if we hit an unknown node or end of execution
        const callStack = session.call_stack || [];
        if (callStack.length > 0) {
           const lastCall = callStack.pop();
           const { data: parentFlow } = await this.supabase.from('automation_flows').select('*').eq('id', lastCall.flow_id).single();
           if (parentFlow) {
              await this.saveSessionState(session.id, lastCall.return_node_id, { current_flow_id: parentFlow.id, call_stack: callStack });
              const updatedSession = { ...session, current_node_id: lastCall.return_node_id, current_flow_id: parentFlow.id, call_stack: callStack };
              return this.execute(parishId, phone, parentFlow, updatedSession);
           }
        }

        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
      }

      } catch (nodeError) {
        console.error(`Interpreter: FATAL ERROR executing node [${currentNode.id}]:`, nodeError);
        // Clean up session on fatal error to prevent loops
        await this.supabase.from('automation_sessions').delete().eq('id', session.id);
        hasMoreSteps = false;
        break;
      }
    }
  }
}
