import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { UazapiProvider } from './providers/WhatsAppProvider';
import { FlowInterpreter } from './engine/Interpreter';

// Load environment variables from the main project
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- ENV CHECK ---');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key Type:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : (process.env.VITE_SUPABASE_ANON_KEY ? 'Anon Key' : '❌ Missing'));
if (supabaseKey && supabaseKey.length < 20) console.warn('⚠️ Supabase Key looks too short!');
console.log('------------------');

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase URLs/Keys not found in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// HELPERS
// ============================================================================
async function getInterpreterForParish(parishId: string, instanceName?: string) {
  const cleanId = parishId.trim();
  const cleanName = instanceName?.trim() || `lumen-parish-${cleanId}`;

  const { data: parish, error } = await supabase
    .from('parishes')
    .select('id, name, whatsapp_token')
    .or(`id.eq.${cleanId},whatsapp_instance_id.eq.${cleanId},whatsapp_instance_id.eq.${cleanName}`)
    .maybeSingle();

  if (error || !parish) {
    if (error) console.error('Database Error:', error);
    console.warn(`❌ Parish [${cleanId}] or [${cleanName}] not found in database.`);
    throw new Error(`Parish ${cleanId} not found in database. Make sure synchronization was completed.`);
  }

  if (!parish.whatsapp_token) {
    console.warn(`❌ Parish [${parish.name}] has no WhatsApp token.`);
    throw new Error('Token not found');
  }

  const provider = new UazapiProvider(parish.whatsapp_token);
  return new FlowInterpreter(supabase, provider);
}

// ============================================================================
// INBOUND WEBHOOK
// ============================================================================
app.post('/webhook/uazapi', async (req, res) => {
  const eventData = req.body;
  console.log(`📡 WEBHOOK HIT: ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers));

  try {
    if (!eventData || typeof eventData !== 'object' || Object.keys(eventData).length === 0) {
      console.warn('⚠️ Webhook hit but body is empty or not JSON. (Check if Content-Type is application/json)');
      console.log('Raw Body summary:', typeof eventData, JSON.stringify(eventData));
      res.status(200).send('Webhook received but body is invalid');
      return;
    }

    console.log(`📦 Webhook Event: "${eventData.event || 'unknown'}" - Keys:`, Object.keys(eventData));

    // Universal Structure Mapping
    let event = eventData.event || eventData.EventType;
    let instanceName = eventData.instance || eventData.instanceName;
    let rawMessages = [];

    // Support for Uazapi V2 / Evolution style
    if (eventData.message && !Array.isArray(eventData.message)) {
      rawMessages = [eventData.message];
    } else if (eventData.data?.messages) {
      rawMessages = eventData.data.messages;
    }

    console.log(`📦 Event: "${event}" - Instance: "${instanceName}" - Messages to process: ${rawMessages.length}`);

    // Adjust event name for compatibility
    if (event === 'MESSAGE' || event === 'messages' || event === 'messages.upsert' || event === 'chat-update') {
      const parishId = instanceName?.includes('lumen-parish-')
        ? instanceName.split('lumen-parish-')[1]
        : instanceName;

      if (!parishId) {
        console.warn('❌ Parish ID not found in instance name:', instanceName);
        res.status(200).send('Instance name missing ID');
        return;
      }

      res.status(200).send('Webhook received');

      console.log(`\n📩 Webhook for Parish ${parishId}: Processing...`);
      const interpreter = await getInterpreterForParish(parishId, instanceName);

      for (const msg of rawMessages) {
        // Log raw message content for debugging
        console.log('--- RAW MSG CONTENT ---');
        console.log(JSON.stringify(msg, null, 2).substring(0, 500));

        // Skip messages sent by the bot itself
        const isFromMe = msg.key?.fromMe || msg.fromMe;
        if (isFromMe) continue;

        // Support for both nested (Baileys/Evolution) and flat (Uazapi) structures
        const sender = (
          msg.from ||
          msg.key?.remoteJid || 
          msg.key?.remote_jid || 
          msg.remoteJid || 
          msg.chatId || 
          msg.chatid || 
          msg.sender
        )?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');

        // Extract text content from various possible locations
        let textContent =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.text ||
          msg.text ||
          '';

        // Handle interaction objects (buttons, lists) from Uazapi/Evolution
        if (!textContent && msg.content) {
          if (typeof msg.content === 'string') {
            textContent = msg.content;
          } else if (msg.content.selectedDisplayText) {
            textContent = msg.content.selectedDisplayText;
          } else if (msg.content.selectedId || msg.content.selectedID) {
            textContent = msg.content.selectedId || msg.content.selectedID;
          }
        }

        // Fallback for buttonOrListid (Uazapi root property)
        if (!textContent && msg.buttonOrListid) {
          textContent = msg.buttonOrListid;
        }

        const normalizedMsg = String(textContent || '').toLowerCase().trim();

        if (!sender) {
          console.warn('⚠️ No sender phone found in message. Full message body:', JSON.stringify(msg, null, 2));
          continue;
        }

        console.log(`👤 From: ${sender} - Text: "${textContent}"`);

        // 1. Check for Active Session
        const { data: session } = await supabase
          .from('automation_sessions')
          .select('*')
          .eq('remote_jid', sender)
          .eq('parish_id', parishId)
          .maybeSingle();

        if (session) {
          console.log(`🔍 Active Session found for ${sender} (Node: ${session.current_node_id})`);
          const lastInteraction = new Date(session.last_interaction).getTime();
          const nowTime = new Date().getTime();
          const diffHours = (nowTime - lastInteraction) / (1000 * 60 * 60);

          if (diffHours > 2) {
            console.log(`⏰ Session for ${sender} expired. Restarting...`);
            await supabase.from('automation_sessions').delete().eq('id', session.id);
          } else {
            const { data: flow } = await supabase
              .from('automation_flows')
              .select('*')
              .eq('id', session.current_flow_id)
              .single();

            if (flow && flow.is_active) {
              console.log(`🤖 Continuing Flow: ${flow.name}`);
              // Track message received in an active session
              await interpreter.trackMetric(parishId as string, flow.id, 'message_in');
              await interpreter.execute(parishId as string, sender, flow, session, textContent);
              continue;
            }
          }
        }

        // 2. Keyword Check
        const { data: flows, error: flowsErr } = await supabase
          .from('automation_flows')
          .select('id, name, trigger_keywords, flow_data')
          .eq('parish_id', parishId)
          .eq('is_active', true)
          .eq('type', 'inbound');

        if (flowsErr) console.error('Error fetching flows:', flowsErr);
        console.log(`🔍 Checking ${flows?.length || 0} flows for text: "${normalizedMsg}"`);

        let matchedFlow = flows?.find(f => {
          const keywords = Array.isArray(f.trigger_keywords) ? f.trigger_keywords : [];
          return keywords.some((kw: string) => {
            const normalizedKw = kw.toLowerCase().trim();
            if (normalizedKw === '*') return true;
            return normalizedMsg === normalizedKw || normalizedMsg.includes(normalizedKw);
          });
        });

        if (matchedFlow) {
          console.log(`🚀 Iniciando Fluxo: ${matchedFlow.name} (ID: ${matchedFlow.id})`);
          const { data: newSession, error: sessionErr } = await supabase
            .from('automation_sessions')
            .insert([{
              parish_id: parishId,
              remote_jid: sender,
              current_flow_id: matchedFlow.id,
              last_interaction: new Date().toISOString(),
              metadata: { name: msg.pushName || msg.pushname || 'Cliente' }
            }])
            .select()
            .single();

          if (sessionErr) console.error('Error creating session:', sessionErr);

          if (newSession) {
            // Track message received on flow start
            await interpreter.trackMetric(parishId as string, matchedFlow.id, 'message_in');
            await interpreter.execute(parishId as string, sender, matchedFlow, newSession);
          }
        } else {
          console.log(`⏭️ No flow matched for: "${textContent}"`);
        }
      }
    } else {
      console.log(`ℹ️ Ignored unhandled event: "${event}"`);
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

// ============================================================================
// OUTBOUND DISPATCH & TEST
// ============================================================================
app.post('/api/workflows/dispatch', async (req, res) => {
  const { parishId, flowId, targetPhone } = req.body;

  if (!parishId || !flowId || !targetPhone) {
    return res.status(400).json({ error: 'parishId, flowId and targetPhone are required.' });
  }

  try {
    const { data: flow, error } = await supabase
      .from('automation_flows')
      .select('*')
      .eq('id', flowId)
      .eq('parish_id', parishId)
      .single();

    if (error || !flow) return res.status(404).json({ error: 'Flow not found.' });

    const interpreter = await getInterpreterForParish(parishId);

    // Create session for outbound
    const { data: session } = await supabase
      .from('automation_sessions')
      .insert([{
        parish_id: parishId,
        remote_jid: targetPhone,
        current_flow_id: flowId,
        last_interaction: new Date().toISOString()
      }])
      .select()
      .single();

    if (session) {
      await interpreter.execute(parishId, targetPhone, flow, session);
    }

    res.status(200).json({ success: true, flowName: flow.name });
  } catch (err: any) {
    console.error('Dispatch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚙️  Lumen Workflow Engine Initialized: PORT ${PORT}`);
  console.log(`======================================================`);
});
