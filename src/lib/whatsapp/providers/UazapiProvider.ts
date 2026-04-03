import type { IWhatsAppProvider, WhatsAppCredentials, WhatsAppQrCode, WhatsAppStatus } from '../types';

export class UazapiProvider implements IWhatsAppProvider {
  private baseURL = import.meta.env.VITE_UAZAPI_URL || 'https://free.uazapi.com';
  private adminToken = import.meta.env.VITE_UAZAPI_TOKEN || '';

  private getHeaders(token?: string, isAdmin = false) {
    const activeToken = token || this.adminToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isAdmin) {
      headers['admintoken'] = activeToken;
    } else {
      // Para chamadas de instância, a Uazapi V2 aceita o token no header 'token' ou 'apikey'
      headers['token'] = activeToken;
      headers['apikey'] = activeToken;
    }

    return headers;
  }

  async createInstance(name: string): Promise<{ token: string; name: string }> {
    try {
      // Regra: Uma instância por paróquia. Verificamos se já existe antes de tentar criar.
      const all = await this.listAllInstances().catch(() => []);
      const existing = all.find(i => i.name === name || i.instanceName === name);
      
      if (existing) {
        // Se já existe, retornamos as credenciais dela (o token/apikey)
        return { 
          token: existing.token || existing.apikey || '', 
          name: existing.name || existing.instanceName || name 
        };
      }

      // Se não existe, procedemos com a criação
      const response = await fetch(`${this.baseURL}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(undefined, true),
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Caso ocorra concorrência e a instância tenha sido criada no intervalo, tentamos buscar uma última vez
        if (response.status === 403 || errorData.message?.includes('exists') || response.status === 400) {
          const finalCheck = await this.listAllInstances();
          const found = finalCheck.find(i => i.name === name || i.instanceName === name);
          if (found) {
            return { 
              token: found.token || found.apikey || '', 
              name: found.name || found.instanceName || name 
            };
          }
        }
        throw new Error(errorData.message || `Falha ao criar instância: ${response.statusText}`);
      }

      const data = await response.json();
      const rootData = data.instance || data;
      
      return {
        token: rootData.token || rootData.apikey || data.token || data.apikey || '',
        name: rootData.name || rootData.instanceName || data.name || data.instanceName || name
      };
    } catch (err: any) {
      console.error('UazapiProvider.createInstance Error:', err);
      throw err;
    }
  }

  async listAllInstances(): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/instance/all`, {
      method: 'GET',
      headers: this.getHeaders(undefined, true)
    });

    if (!response.ok) {
      throw new Error(`Falha ao listar instâncias: ${response.statusText}`);
    }

    return await response.json();
  }

  async getInstanceStatus(creds: WhatsAppCredentials): Promise<WhatsAppStatus> {
    const response = await fetch(`${this.baseURL}/instance/status`, {
      method: 'GET',
      headers: this.getHeaders(creds.token)
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { connected: false, state: 'disconnected' };
      }
      throw new Error(`Falha ao verificar status: ${response.statusText}`);
    }

    const data = await response.json();
    
    // According to OpenAPI: data.status.connected (bool) or data.instance.status (string)
    const isConnected = 
      data?.status?.connected === true || 
      data?.instance?.status === 'connected' ||
      data?.instance?.status === 'open' ||
      data?.connected === true;

    const rootData = data?.instance || data?.status || data;
    const rawStatus = typeof data?.instance?.status === 'string' ? data.instance.status : (isConnected ? 'connected' : 'disconnected');
    
    return {
      connected: isConnected,
      state: rawStatus,
      qrcode: this.ensureBase64Prefix(rootData?.qrcode || rootData?.base64 || data?.qrcode),
      pairingCode: rootData?.code || rootData?.pairingCode || rootData?.pairing_code || data?.pairingCode || null,
      instanceName: data?.instance?.name || data?.name
    };
  }

  async getQrCode(creds: WhatsAppCredentials, phone?: string): Promise<WhatsAppQrCode> {
    const response = await fetch(`${this.baseURL}/instance/connect`, {
      method: 'POST',
      headers: this.getHeaders(creds.token),
      body: JSON.stringify(phone ? { phone } : {})
    });

    if (!response.ok) {
      throw new Error(`Falha ao obter conexão: ${response.statusText}`);
    }

    const data = await response.json();
    const rootData = data?.data || data?.instance || data;
    const qrcodeBase64 = rootData?.qrcode || rootData?.base64 || rootData?.qrCode || rootData?.qr_code || null;
    const pairingCodeStr = rootData?.code || rootData?.pairingCode || rootData?.pairing_code || null;

    return {
      qrcode: this.ensureBase64Prefix(qrcodeBase64),
      pairingCode: pairingCodeStr
    };
  }

  private ensureBase64Prefix(code: any): string | null {
    if (!code || typeof code !== 'string') return null;
    if (code.startsWith('data:image')) return code;
    // Re-check if it's already a full base64 string or just the hash
    if (code.length < 100) return null; // Likely not a QR base64
    return `data:image/png;base64,${code}`;
  }

  async sendMessage(creds: WhatsAppCredentials, phone: string, content: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/message/sendText`, {
      method: 'POST',
      headers: this.getHeaders(creds.token),
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: "composing"
        },
        textMessage: {
          text: content
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Falha ao enviar mensagem: ${response.statusText}`);
    }

    return await response.json();
  }

  async disconnect(creds: WhatsAppCredentials): Promise<void> {
    const response = await fetch(`${this.baseURL}/instance/disconnect`, {
      method: 'POST',
      headers: this.getHeaders(creds.token)
    });

    if (!response.ok) {
      if (response.status === 404) return;
      throw new Error(`Falha ao desconectar instância: ${response.statusText}`);
    }
  }
}
