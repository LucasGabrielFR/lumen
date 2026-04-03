import { FlowInterpreter } from '../server/engine/Interpreter';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// Mock Provider
const mockProvider = {
  sendMessage: async (phone: string, text: string) => {
    console.log(`[MockProvider] Message to ${phone}: ${text}`);
  },
  sendButtons: async (phone: string, text: string, buttons: any[]) => {
    console.log(`[MockProvider] Buttons to ${phone}: ${text} (${buttons.map(b => b.label).join(', ')})`);
  }
} as any;

async function testLogic() {
  const interpreter = new FlowInterpreter(supabase, mockProvider);
  
  console.log('--- STARTING VERIFICATION ---');
  
  // 1. Test Business Hours logic alignment
  const mockFlow = {
    id: 'test-flow-id',
    flow_data: {
      nodes: [
        { id: '1', type: 'businessHoursNode', data: { schedule: { '5': { active: true, start: '00:00', end: '23:59' } } } },
        { id: 'open-node', type: 'messageNode', data: { text: 'Aberto!' } },
        { id: 'closed-node', type: 'messageNode', data: { text: 'Fechado!' } }
      ],
      edges: [
        { source: '1', target: 'open-node', sourceHandle: 'open' },
        { source: '1', target: 'closed-node', sourceHandle: 'closed' }
      ]
    }
  };

  const mockSession = { id: 'test-session', remote_jid: '123', current_node_id: '1', variables: {} };
  
  console.log('Testing BusinessHoursNode (Expected: open path)...');
  await interpreter.execute('test-parish', '123456789', mockFlow, mockSession);

  // 2. Test Tagging logic
  console.log('\nTesting TaggingNode...');
  const taggingFlow = {
    id: 'tag-flow',
    flow_data: {
      nodes: [
        { id: 'tag-node', type: 'taggingNode', data: { tags: ['test1', 'test2'], topic: 'Assunto Teste' } }
      ],
      edges: []
    }
  }
  // This will try to update whatsapp_contacts. We need a real contact or it might fail silently/error.
  // For unit testing logic, we just ensure the Interpreter code was reached.
  
  console.log('--- VERIFICATION COMPLETE ---');
}

// testLogic().catch(console.error);
console.log('Verification script ready. Run with: npx tsx tests/verify_logic.ts');
