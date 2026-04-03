import { UazapiProvider } from './providers/UazapiProvider';
import type { IWhatsAppProvider } from './types';

// O provedor ativo globalmente no sistema. 
// No futuro, podemos alterar isso para retornar provedores dinâmicos
// (por exemplo, ZApiProvider vs UazapiProvider) baseado em configuração do banco de dados.
export const whatsappService: IWhatsAppProvider = new UazapiProvider();

export * from './types';
