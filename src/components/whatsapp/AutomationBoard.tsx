import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  MessageSquare, 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Activity, 
  Zap,
  ShieldCheck,
  RefreshCw,
  MoreVertical,
  Loader2,
  CheckCircle2,
  Smartphone,
  ChevronRight,
  QrCode,
  Hash,
  Database
} from 'lucide-react'
import { whatsappService } from '../../lib/whatsapp'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export const AutomationBoard = () => {
  const { profile } = useAuth()
  
  // WhatsApp Configuration State
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'pairing'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [instanceToken, setInstanceToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Load existing token and check instance existence on mount
  useEffect(() => {
    const checkExistingInstance = async () => {
      if (!profile?.parish_id) return;
      
      // 1. Try loading from DB first for speed
      const { data: dbData } = await supabase
        .from('parishes')
        .select('whatsapp_token')
        .eq('id', profile.parish_id)
        .single();
      
      if (dbData?.whatsapp_token) {
        setInstanceToken(dbData.whatsapp_token);
        return; // Already have a token, go directly to Step 2
      }

      // 2. If no token in DB, silently check the provider once
      try {
        setIsInitializing(true);
        const instanceName = `lumen-parish-${profile.parish_id}`;
        // List instances to see if it already exists there
        const list = await whatsappService.listAllInstances();
        const found = list.find((i: any) => i.name === instanceName || i.instanceName === instanceName);
        
        if (found) {
          setInstanceToken(found.token || found.apikey);
          // Sync it back to DB
          await supabase
            .from('parishes')
            .update({ 
              whatsapp_token: found.token || found.apikey,
              whatsapp_instance_id: found.name || found.instanceName || instanceName
            })
            .eq('id', profile.parish_id);
        }
      } catch (err) {
        console.warn('Silent check failed, user will need to manual init', err);
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkExistingInstance();
  }, [profile?.parish_id]);

  // Initialize Instance for Parish (Manual triggered by button)
  const initInstance = async () => {
    if (!profile?.parish_id) return;
    
    try {
      setIsInitializing(true);
      setInitError(null);
      // Naming convention: lumen-parish-{id}
      const instanceName = `lumen-parish-${profile.parish_id}`;
      const result = await whatsappService.createInstance(instanceName);
      
      // Save token and instance ID to DB
      if (result.token) {
        await supabase
          .from('parishes')
          .update({ 
            whatsapp_token: result.token,
            whatsapp_instance_id: result.name || instanceName
          })
          .eq('id', profile.parish_id);
      }

      setInstanceToken(result.token);
    } catch (err: any) {
      console.error('Error initializing WhatsApp instance:', err);
      setInitError(err.message || 'Erro ao preparar instância do WhatsApp');
    } finally {
      setIsInitializing(false);
    }
  };

  // WhatsApp Credentials for internal calls - uses the dynamic instance token
  const whatsappCreds = { token: instanceToken || '' };
  const hasCreds = !!instanceToken;

  // New query to check database synchronization status
  const { data: parishData, refetch: refetchParish } = useQuery({
    queryKey: ['parish-whatsapp-sync', profile?.parish_id],
    queryFn: async () => {
      if (!profile?.parish_id) return null;
      const { data, error } = await supabase
        .from('parishes')
        .select('whatsapp_instance_id, whatsapp_token, whatsapp_connected')
        .eq('id', profile.parish_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.parish_id
  });




  // Mutations WhatsApp
  const pairingMutation = useMutation({
    mutationFn: (phone?: string) => {
      if (!hasCreds) throw new Error('Instância não inicializada');
      // Enforce +55 rule (digits only, prefix already assumed)
      const cleanPhone = phone ? `55${phone.replace(/\D/g, '')}` : undefined;
      return whatsappService.getQrCode(whatsappCreds, cleanPhone);
    },
    onSuccess: (data: any) => {
       const code = data.qrcode || data.pairingCode;
       if (code) {
          setPairingCode(code)
       }
    },
    onError: (err: any) => alert(`Erro ao iniciar conexão: ${err.message}`)
  })


  const { data: statusData, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['whatsappStatus', pairingCode, whatsappCreds?.token],
    queryFn: async () => {
      const data = await whatsappService.getInstanceStatus(whatsappCreds);
      
      // Update local pairing code if one arrives via status polling
      if (!data.connected) {
        const liveCode = data.qrcode || data.pairingCode;
        if (liveCode && liveCode !== pairingCode) {
          setPairingCode(liveCode);
        }
      }
      
      return data;
    },
    enabled: hasCreds,
    refetchInterval: (query) => {
       // Poll se estamos aguardando o QR Code ser lido
       if (query.state.data?.connected !== true && pairingCode) return 5000
       return false
    }
  })

  // Para provedores API, status de conexão geralmente retorna booleano
  const isInstanceActive = statusData?.connected === true

  const needsSync = isInstanceActive && (!parishData?.whatsapp_instance_id || !parishData?.whatsapp_token);

  const syncWithDatabase = async () => {
    if (!profile?.parish_id || isSyncing) return;
    
    try {
      setIsSyncing(true);
      const instanceName = `lumen-parish-${profile.parish_id}`;
      
      console.log('Sincronizando com o banco:', { instanceName });
      
      // Obter credenciais via API/Provider
      const result = await whatsappService.createInstance(instanceName);
      
      console.log('Resultado do Provider:', {
        name: result.name,
        hasToken: !!result.token,
        tokenLength: result.token?.length
      });

      if (!result.token || !result.name) {
        throw new Error('A API não retornou todos os dados necessários (token ou nome da instância).');
      }

      // Limpar espaços e quebras de linha antes de salvar
      const cleanToken = result.token.trim();
      const cleanInstanceId = result.name.trim();

      console.log('Enviando para o Supabase...', { 
        id: profile.parish_id,
        whatsapp_instance_id: cleanInstanceId,
        whatsapp_token: '***' + cleanToken.slice(-4)
      });
      
      const { error: updateError } = await supabase
        .from('parishes')
        .update({ 
          whatsapp_token: cleanToken,
          whatsapp_instance_id: cleanInstanceId, 
          whatsapp_connected: true
        })
        .eq('id', profile.parish_id);

      if (updateError) {
        console.error('Erro de persistência no Supabase:', updateError);
        throw new Error(`Erro ao salvar no banco de dados: ${updateError.message}`);
      }
      
      // Update local state and refetch both queries
      setInstanceToken(cleanToken);
      await Promise.all([
        refetchParish(),
        refetchStatus()
      ]);
      
      alert('Configurações salvas e sincronizadas com sucesso!');
    } catch (err: any) {
      console.error('Erro crítico na sincronização:', err);
      alert(`Falha na sincronização: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Limpa o código de pareamento assim que a conexão é confirmada
  useEffect(() => {
    if (isInstanceActive && pairingCode) {
      setPairingCode(null);
    }
  }, [isInstanceActive, pairingCode]);

  const logoutMutation = useMutation({
    mutationFn: () => whatsappService.disconnect(whatsappCreds),
    onSuccess: () => {
      setPairingCode(null)
      refetchStatus()
    }
  })

  const handleLogout = () => {
    if (confirm('Deseja realmente desconectar esta instância do WhatsApp?')) {
      logoutMutation.mutate()
    }
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 15) { // (11) 99999-9999 is 15 chars if fully entered
      setPhoneNumber(formatted);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  // Fetch Automation Flows
  const { data: flowsData } = useQuery({
    queryKey: ['automation_flows', profile?.parish_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_flows')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!profile?.parish_id
  })

  const automationFlows = flowsData || []

  return (
    <div className="flex flex-col gap-8">
      {/* Header com Status da Instância */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-lumen-navy flex items-center gap-3">
            Automação de Atendimento
            <span className="bg-lumen-gold/10 text-lumen-gold text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg border border-lumen-gold/20 font-black">Beta</span>
          </h2>
          <p className="text-slate-500 font-medium">Conecte o WhatsApp e automatize a paróquia sem QR Code.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          {isLoadingStatus || isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <div className={`w-3 h-3 rounded-full ${isInstanceActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          )}
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            {isInitializing ? 'Preparando...' : isInstanceActive ? 'Conectado' : 'Aguardando Conexão'}
          </span>

          <button 
            onClick={() => refetchStatus()}
            className="ml-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-all"
            title="Atualizar Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>

          {needsSync && isInstanceActive && (
            <button
              onClick={syncWithDatabase}
              disabled={isSyncing}
              className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm shadow-emerald-200 animate-in fade-in zoom-in duration-300"
            >
              {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              Sincronizar com o banco
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Conexão (Pairing Code Flow) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
            
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                  <Smartphone className="w-6 h-6 text-indigo-500" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-lumen-navy leading-tight">Vincular Número</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Status: {isInstanceActive ? 'Ativo' : 'Aguardando'}</p>
               </div>
            </div>

            {/* FLOW STEPS WHATSAPP */}
            <div className="space-y-6">
              
              {/* Step 1: Initialization */}
              <div className={`flex items-start gap-4 transition-opacity ${isInitializing ? 'opacity-50' : 'opacity-100'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${hasCreds ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                     {hasCreds ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-black text-slate-700">Inicialização</p>
                     <p className="text-[10px] font-medium text-slate-500 mb-3">Canal seguro de comunicação.</p>
                     
                     {isInitializing ? (
                       <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 w-fit">
                          <Loader2 className="w-3 h-3 animate-spin" /> Preparando...
                       </div>
                     ) : initError ? (
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 w-fit">
                            Erro na inicialização
                         </div>
                         <button 
                           onClick={initInstance}
                           className="text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-widest"
                         >
                           Tentar Novamente
                         </button>
                       </div>
                     ) : hasCreds ? (
                       <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Instância Pronta
                       </div>
                     ) : (
                        <button 
                          onClick={initInstance}
                          className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all w-fit group"
                        >
                           Iniciar Conexão <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                     )}
                  </div>
              </div>

              {/* Step 2: Método de Conexão */}
              <div className={`flex items-start gap-4 transition-all duration-500 ${hasCreds && !pairingCode ? 'scale-100 opacity-100' : pairingCode ? 'opacity-40' : 'opacity-20'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${isInstanceActive ? 'bg-emerald-500 text-white' : hasCreds ? 'bg-lumen-navy text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isInstanceActive ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                 </div>
                  <div className="flex-1">
                     <p className="text-sm font-black text-slate-700">Conectar Aparelho</p>
                     
                     {isInstanceActive && (
                        <div className="mt-4 bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center gap-3 text-center animate-in zoom-in-95 duration-500">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-emerald-900 uppercase">WhatsApp Conectado!</p>
                              <p className="text-[10px] text-emerald-600 mt-1">Aparelho pareado com sucesso.</p>
                           </div>
                           <button 
                             onClick={() => logoutMutation.mutate()}
                             className="mt-2 text-[8px] font-black uppercase tracking-tighter text-emerald-700/50 hover:text-emerald-700 transition-colors"
                           >
                             Desconectar Aparelho
                           </button>
                        </div>
                     )}
                    {hasCreds && !isInstanceActive && !pairingCode && isLoadingStatus && (
                         <div className="flex items-center gap-2 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-lumen-navy" /> Verificando status da conexão...
                         </div>
                    )}

                    {hasCreds && !isInstanceActive && !pairingCode && !isLoadingStatus && (
                      <div className="space-y-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-700">
                        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                           <button 
                             onClick={() => setConnectionMethod('qr')}
                             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${connectionMethod === 'qr' ? 'bg-white shadow-sm text-lumen-navy' : 'text-slate-400 hover:text-slate-600'}`}
                           >
                             <QrCode className="w-3 h-3" /> QR Code
                           </button>
                           <button 
                             onClick={() => setConnectionMethod('pairing')}
                             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${connectionMethod === 'pairing' ? 'bg-white shadow-sm text-lumen-navy' : 'text-slate-400 hover:text-slate-600'}`}
                           >
                             <Hash className="w-3 h-3" /> Código
                           </button>
                        </div>

                        {connectionMethod === 'pairing' && (
                          <div className="relative animate-in slide-in-from-top-2">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">
                              +55
                            </div>
                            <input 
                              type="text" 
                              placeholder="(11) 99999-9999"
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-lumen-navy/10 focus:border-lumen-navy transition-all"
                            />
                          </div>
                        )}
                        
                        <button 
                          onClick={() => pairingMutation.mutate(connectionMethod === 'pairing' ? phoneNumber : undefined)}
                          disabled={pairingMutation.isPending || (connectionMethod === 'pairing' && phoneNumber.replace(/\D/g, '').length < 10)}
                          className="w-full bg-lumen-navy text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {pairingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Solicitar Conexão'}
                           {!pairingMutation.isPending && <ChevronRight className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                 </div>
              </div>

              {/* Step 3: Conectar */}
              <div className={`flex items-start gap-4 transition-all duration-500 ${pairingCode && !isInstanceActive ? 'scale-100 opacity-100' : isInstanceActive ? 'opacity-40' : 'opacity-20'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isInstanceActive ? 'bg-emerald-500 text-white' : pairingCode ? 'bg-lumen-navy text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isInstanceActive ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                 </div>
                 <div className="flex-1">
                    <p className="text-sm font-black text-slate-700">Pareamento</p>
                    
                    {pairingCode && !isInstanceActive && (
                        <div className="mt-4">
                           {connectionMethod === 'qr' && pairingCode.startsWith('data:image') ? (
                              <div className="bg-white p-4 rounded-[32px] shadow-2xl border border-slate-100 text-center">
                                 <div className="bg-slate-50 p-4 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center min-h-[200px]">
                                    <img src={pairingCode} alt="QR Code" className="max-w-full aspect-square object-contain" />
                                    {pairingMutation.isPending && (
                                       <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                          <Loader2 className="w-8 h-8 animate-spin text-lumen-navy" />
                                       </div>
                                    )}
                                 </div>
                                 <button onClick={() => pairingMutation.mutate(undefined)} className="text-[10px] font-black uppercase text-slate-400 hover:text-lumen-navy flex items-center gap-2 mx-auto">
                                   <RefreshCw className={`w-3 h-3 ${pairingMutation.isPending ? 'animate-spin' : ''}`} /> Atualizar QR
                                 </button>
                              </div>
                           ) : (
                              <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 text-center">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seu Código</p>
                                 <div className="flex justify-center gap-2 mb-6">
                                    {pairingCode.split('').map((char, i) => (
                                       <div key={i} className="w-8 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xl font-black text-lumen-navy">
                                          {char}
                                       </div>
                                    ))}
                                 </div>
                                 <button 
                                   onClick={() => copyToClipboard(pairingCode)}
                                   className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                 >
                                   {copySuccess ? 'Copiado!' : 'Copiar Código'}
                                 </button>
                              </div>
                           )}
                        </div>
                    )}

                    {isInstanceActive && (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mt-4">
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                           <div>
                              <p className="text-xs font-black text-emerald-900 uppercase">Conectado</p>
                              <p className="text-[10px] text-emerald-600">Automação ativa.</p>
                           </div>
                        </div>
                    )}
                 </div>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               Canal Seguro e Criptografado
            </div>
          </div>

          <div className="bg-lumen-navy rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 opacity-10">
                <Settings className="w-40 h-40 rotate-12" />
             </div>
             <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurar Instância
             </h4>
             <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID da Instância</p>
                    <p className="font-mono text-xs truncate opacity-70">lumen-parish-{profile?.parish_id}</p>
                 </div>
                 <button 
                   className="w-full py-4 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/30"
                   onClick={handleLogout}
                   disabled={logoutMutation.isPending || !hasCreds}
                 >
                    {logoutMutation.isPending ? 'Desconectando...' : 'Remover Conexão'}
                 </button>
             </div>
          </div>

        </div>

        {/* Coluna de Fluxos e Gestão */}
        <div className="lg:col-span-2 space-y-8">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-500">
                   <MessageSquare className="w-6 h-6" />
                </div>
                <h5 className="text-3xl font-black text-slate-800">1,284</h5>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total de Mensagens</p>
             </div>
             <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-500">
                   <Zap className="w-6 h-6" />
                </div>
                <h5 className="text-3xl font-black text-slate-800">469</h5>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ações Automatizadas</p>
             </div>
             <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500">
                   <Activity className="w-6 h-6" />
                </div>
                <h5 className="text-3xl font-black text-slate-800">92%</h5>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Taxa de Resolução</p>
             </div>
          </div>

          {/* Lista de Fluxos */}
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-lumen-navy">Fluxos de Conversa</h3>
                <p className="text-sm text-slate-500 font-medium">Gerencie as respostas automáticas da paróquia.</p>
              </div>
              <Link 
                to="/parish/automation/flows"
                className="bg-lumen-teal text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-lumen-teal/20 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Fluxo
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {automationFlows.length > 0 ? (
                automationFlows.map((flow: any) => (
                  <div key={flow.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 ${
                        flow.is_active 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-500' 
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}>
                        {flow.is_active ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 group-hover:text-lumen-navy transition-colors">{flow.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex gap-1">
                            {flow.trigger_keywords?.map((trigger: string, i: number) => (
                              <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                {trigger}
                              </span>
                            ))}
                          </div>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            0 execuções
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Link 
                        to={`/parish/automation/flows?id=${flow.id}`}
                        className="p-3 text-slate-400 hover:text-lumen-navy hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                      <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum fluxo configurado</p>
                  <Link to="/parish/automation/flows" className="text-xs font-black text-lumen-teal hover:underline uppercase tracking-widest">
                    Começar agora
                  </Link>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50/50 text-center">
               <Link 
                 to="/parish/automation/flows"
                 className="text-xs font-black text-slate-400 hover:text-lumen-navy uppercase tracking-widest transition-all"
               >
                  Visualizar todos os fluxos
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
