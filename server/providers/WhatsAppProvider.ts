import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

export interface IWhatsAppProvider {
  sendMessage(phone: string, text: string, options?: any): Promise<any>;
  sendButtons(phone: string, text: string, buttons: { id: string, label: string }[]): Promise<any>;
}

export class UazapiProvider implements IWhatsAppProvider {
  private token: string;
  private uazapiUrl: string;

  constructor(token: string) {
    this.token = token;
    this.uazapiUrl = process.env.VITE_UAZAPI_URL || 'https://free.uazapi.com';
  }

  async sendMessage(phone: string, text: string, options: any = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${this.uazapiUrl}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token
        },
        signal: controller.signal,
        body: JSON.stringify({
          number: phone,
          text: text,
          delay: options.delay || 1200,
          presence: options.presence || "composing",
          ...options
        })
      });

      clearTimeout(id);
      const result = await response.json();
      console.log(`Provider: SendText Response [${response.status}]`, JSON.stringify(result));

      if (!response.ok) {
        throw new Error(`Uazapi error: ${response.statusText} - ${JSON.stringify(result)}`);
      }
      return result;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async sendButtons(phone: string, text: string, buttons: { id: string, label: string }[]) {
    // Uazapi V2 uses /send/menu with type: "button"
    const response = await fetch(`${this.uazapiUrl}/send/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': this.token
      },
      body: JSON.stringify({
        number: phone,
        type: "button",
        text: text,
        choices: buttons.map(b => `${b.label}|${b.id}`),
        footerText: "Selecione uma opção"
      })
    });

    const result = await response.json();
    console.log(`Provider: SendButtons Response [${response.status}]`, JSON.stringify(result));

    if (!response.ok) {
      // Fallback to text list if buttons not supported or endpoint fails
      const listText = text + "\n\n" + buttons.map((b, i) => `${i + 1}. ${b.label}`).join('\n');
      return this.sendMessage(phone, listText);
    }
    return result;
  }
}
