export interface WhatsAppCredentials {
  token: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  state?: string;           // 'disconnected', 'connecting', 'connected'
  qrcode?: string | null;   // QR Code base64 se estiver conectando
  pairingCode?: string | null; // Código de pareamento se disponível
  instanceName?: string;     // Nome da instância que está operando
}

export interface WhatsAppQrCode {
  qrcode: string | null;  // Base64 ou string do qrcode
  pairingCode?: string | null;   // Pairing code de 8 dígitos
}

export interface IWhatsAppProvider {
  createInstance(name: string): Promise<{ token: string; name: string }>;
  listAllInstances(): Promise<any[]>;
  getInstanceStatus(creds: WhatsAppCredentials): Promise<WhatsAppStatus>;
  getQrCode(creds: WhatsAppCredentials, phone?: string): Promise<WhatsAppQrCode>;
  sendMessage(creds: WhatsAppCredentials, phone: string, content: string): Promise<any>;
  disconnect(creds: WhatsAppCredentials): Promise<void>;
}
