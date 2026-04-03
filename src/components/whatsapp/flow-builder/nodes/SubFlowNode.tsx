import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Layers, X, Loader2, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../contexts/AuthContext'
import type { Tables } from '../../../../types/database'

type FlowRow = Pick<Tables<'automation_flows'>, 'id' | 'name'>

type SubFlowNodeData = {
  id: string
  subFlowId?: string
  onChange?: (id: string, key: string, value: any) => void
  onDeleteNode?: (id: string) => void
}

export const SubFlowNode = memo(({ data, isConnectable }: NodeProps & { data: SubFlowNodeData }) => {
  const { profile } = useAuth()

  const { data: flows, isLoading } = useQuery({
    queryKey: ['automation_flows', profile?.parish_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_flows')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data as FlowRow[]
    },
    enabled: !!profile?.parish_id
  })

  // Filter out the current flow to prevent direct self-recursion
  // (though the engine handles it, it's better UX)
  // We don't have the current flow ID here directly, 
  // but we can get it from the URL if needed, 
  // or just leave all flows for now as it's simpler.

  return (
    <div className="group relative min-w-[300px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4 overflow-hidden">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Chamar Sub-Fluxo</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          Este nó pausará o fluxo atual e iniciará o fluxo selecionado. Ao terminar o sub-fluxo, o usuário retornará aqui automaticamente.
        </p>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-lumen-navy flex items-center gap-2">
            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
            Fluxo de Destino:
          </label>
          
          <div className="relative bg-slate-50 border-2 border-lumen-navy group-focus-within:bg-white transition-colors overflow-hidden">
            {isLoading ? (
              <div className="w-full p-2.5 flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs font-bold uppercase">Carregando fluxos...</span>
              </div>
            ) : (
              <>
                <select
                  className="nodrag nopan w-full p-2.5 text-xs font-black text-lumen-navy bg-transparent border-0 outline-none appearance-none cursor-pointer pr-10"
                  value={data.subFlowId || ''}
                  onChange={(e) => data.onChange?.(data.id, 'subFlowId', e.target.value)}
                >
                  <option value="" disabled className="font-bold">Selecione um fluxo...</option>
                  {flows?.map((flow: FlowRow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lumen-navy">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Node Handle - Source */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-right-[4px]"
      />
    </div>
  )
})
