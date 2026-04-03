import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { 
  Plus, 
  ArrowLeft, 
  Save, 
  Trash2, 
  ChevronRight,
  MessageSquare,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { FlowBuilder } from '../../components/whatsapp/flow-builder/FlowBuilder'

export const FlowsPage = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const flowId = searchParams.get('id')
  
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'inbound' | 'outbound'>('inbound')
  const [testPhone, setTestPhone] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Fetch Flows
  const { data: flows, isLoading } = useQuery({
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

  // Selected Flow
  const selectedFlow = flows?.find(f => f.id === flowId)

  // Mutations
  const createFlow = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('automation_flows')
        .insert([{ 
          name, 
          type: newType,
          parish_id: profile?.parish_id,
          flow_data: { nodes: [], edges: [] }
        }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] })
      setSearchParams({ id: data.id })
      setIsCreating(false)
      setNewName('')
    }
  })

  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_flows').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] })
      setSearchParams({})
    }
  })

  const [newKeyword, setNewKeyword] = useState('')

  const updateFlow = useMutation({
    mutationFn: async (updates: any) => {
      if (!flowId) throw new Error('ID do fluxo não encontrado')
      const { data, error } = await supabase
        .from('automation_flows')
        .update(updates)
        .eq('id', flowId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] })
    }
  })

  const addKeyword = () => {
    if (!newKeyword || !selectedFlow) return
    const keywords = selectedFlow.trigger_keywords || []
    if (keywords.includes(newKeyword)) return
    
    updateFlow.mutate({ trigger_keywords: [...keywords, newKeyword] })
    setNewKeyword('')
  }

  const removeKeyword = (kw: string) => {
    if (!selectedFlow) return
    const keywords = selectedFlow.trigger_keywords || []
    updateFlow.mutate({ trigger_keywords: keywords.filter((k: string) => k !== kw) })
  }

  const dispatchFlow = async (phone: string) => {
    if (!selectedFlow) return
    setIsTesting(true)
    try {
      const response = await fetch('http://localhost:3001/api/workflows/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parishId: profile?.parish_id,
          flowId: selectedFlow.id,
          targetPhone: phone
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Fluxo disparado com sucesso!')
      } else {
        toast.error('Erro ao disparar fluxo: ' + result.error)
      }
    } catch (error) {
      toast.error('Erro de conexão com o motor de workflows (verifique se o servidor local está rodando)')
    } finally {
      setIsTesting(false)
      setTestPhone('')
    }
  }

  if (flowId && selectedFlow) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden h-[calc(100vh-8rem)]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSearchParams({})}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all text-slate-400 hover:text-lumen-navy shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-lumen-navy flex items-center gap-3">
                {selectedFlow.name}
                <button 
                  onClick={() => updateFlow.mutate({ is_active: !selectedFlow.is_active })}
                  className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg font-black border transition-all ${
                  selectedFlow.is_active 
                    ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                }`}>
                  {selectedFlow.is_active ? 'Ativo' : 'Pausado'}
                </button>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button 
                    onClick={() => updateFlow.mutate({ type: 'inbound' })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedFlow.type === 'inbound' ? 'bg-white text-lumen-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Inbound
                  </button>
                  <button 
                    onClick={() => updateFlow.mutate({ type: 'outbound' })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedFlow.type === 'outbound' ? 'bg-white text-lumen-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Outbound
                  </button>
                </div>
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Editor de Fluxo de Conversa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => updateFlow.mutate({})}
               className="bg-lumen-teal text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:shadow-lg hover:shadow-lumen-teal/20 transition-all flex items-center gap-2 shadow-md border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
             >
                <Save className="w-4 h-4" /> Salvar Alterações
             </button>
          </div>
        </header>

        <div className="flex flex-col flex-1 min-h-0 min-w-0">
           {/* Área Principal de Edição - Agora Full Width */}
           <div className="flex-1 bg-white rounded-[40px] border border-slate-100 shadow-xl flex flex-col relative overflow-hidden min-h-[600px]">
               <FlowBuilder 
                   isActive={selectedFlow.is_active ?? false}
                   onActiveToggle={(active) => updateFlow.mutate({ is_active: active })}
                   triggerKeywords={selectedFlow.trigger_keywords || []}
                   onAddKeyword={addKeyword}
                   onRemoveKeyword={removeKeyword}
                   initialNodes={(selectedFlow.flow_data as any)?.nodes || []}
                   initialEdges={(selectedFlow.flow_data as any)?.edges || []}
                   testPhone={testPhone}
                   setTestPhone={setTestPhone}
                   isTesting={isTesting}
                   onTest={dispatchFlow}
                   onSave={(nodes, edges) => {
                      updateFlow.mutate({ flow_data: { nodes, edges } })
                      toast.success('Fluxo salvo com sucesso!')
                   }}
               />
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-lumen-navy flex items-center gap-4">
            Gestão de Fluxos
            <span className="bg-lumen-gold/10 text-lumen-gold text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-xl border border-lumen-gold/20 font-black">Inteligência</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">Personalize a experiência de quem entra em contato com a paróquia.</p>
        </div>

        <button 
          onClick={() => {
            setNewType('inbound')
            setIsCreating(true)
          }}
          className="bg-lumen-navy text-white px-8 py-4 rounded-[32px] font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:shadow-lumen-navy/40 transition-all flex items-center gap-3 hover:-translate-y-1"
        >
          <Plus className="w-4 h-4" /> Novo Fluxo Estruturado
        </button>
      </header>

      {/* Grid de Fluxos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        {isCreating && (
           <div className="bg-white rounded-[40px] p-8 shadow-2xl border-2 border-lumen-teal/30 animate-in zoom-in-95 duration-300 col-span-1 md:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-black text-lumen-teal uppercase tracking-widest mb-2">Novo Fluxo</p>
              <h3 className="text-xl font-black text-slate-800 mb-6">Configurações iniciais</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setNewType('inbound')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${newType === 'inbound' ? 'border-lumen-teal bg-lumen-teal/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <MessageSquare className={`w-5 h-5 ${newType === 'inbound' ? 'text-lumen-teal' : 'text-slate-300'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${newType === 'inbound' ? 'text-lumen-teal' : 'text-slate-400'}`}>Entrada</span>
                </button>
                <button 
                  onClick={() => setNewType('outbound')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${newType === 'outbound' ? 'border-lumen-teal bg-lumen-teal/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <Zap className={`w-5 h-5 ${newType === 'outbound' ? 'text-lumen-teal' : 'text-slate-300'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${newType === 'outbound' ? 'text-lumen-teal' : 'text-slate-400'}`}>Saída</span>
                </button>
              </div>

              <input 
                autoFocus
                type="text" 
                placeholder="Ex: Secretaria Paroquial"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-lumen-teal/10 focus:border-lumen-teal outline-none transition-all mb-4 placeholder:text-slate-300"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <div className="flex gap-3">
                 <button 
                   disabled={!newName || createFlow.isPending}
                   onClick={() => createFlow.mutate(newName)}
                   className="flex-1 bg-lumen-navy text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                 >
                   {createFlow.isPending ? 'Criando...' : 'Criar Agora'}
                 </button>
                 <button 
                   onClick={() => setIsCreating(false)}
                   className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
           </div>
        )}

        {isLoading ? (
          <div className="col-span-full h-60 flex items-center justify-center bg-white rounded-[40px] border border-slate-100">
             <div className="w-8 h-8 border-4 border-slate-100 border-t-lumen-teal rounded-full animate-spin" />
          </div>
        ) : flows?.length === 0 && !isCreating ? (
           <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                 <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Nenhum fluxo criado</h3>
              <p className="text-slate-500 font-medium mb-8">Comece agora criando seu primeiro menu de atendimento.</p>
              <button 
                 onClick={() => setIsCreating(true)}
                 className="text-xs font-black text-lumen-teal hover:underline uppercase tracking-widest"
              >
                  Clique para começar
              </button>
           </div>
        ) : (
          flows?.map((flow) => (
             <div 
               key={flow.id} 
               className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col group cursor-pointer relative overflow-hidden"
               onClick={() => setSearchParams({ id: flow.id })}
             >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 ${
                     flow.is_active 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-500' 
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                   }`}>
                      {flow.type === 'outbound' ? <Zap className="w-6 h-6 fill-current" /> : <MessageSquare className="w-6 h-6 fill-current" />}
                   </div>
                   <button 
                     onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Deseja excluir este fluxo?')) deleteFlow.mutate(flow.id)
                     }}
                     className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="relative z-10 mb-6">
                   <h4 className="text-xl font-black text-slate-800 mb-2 group-hover:text-lumen-navy transition-colors">{flow.name}</h4>
                   <div className="flex flex-wrap gap-1">
                      {flow.type === 'outbound' ? (
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-widest">Fluxo de Saída</span>
                      ) : flow.trigger_keywords && flow.trigger_keywords.length > 0 ? (
                         flow.trigger_keywords.map((kw: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                               {kw}
                            </span>
                         ))
                      ) : (
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem palavras-chave</span>
                      )}
                   </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Fluxo</span>
                      <span className="text-sm font-black text-slate-800 uppercase">{flow.type || 'Inbound'}</span>
                   </div>
                   <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-lumen-navy group-hover:text-white transition-all shadow-sm">
                      <ChevronRight className="w-5 h-5" />
                   </div>
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  )
}
