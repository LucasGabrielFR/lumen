import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { GitBranch, Check, X } from 'lucide-react'

type ConditionNodeData = {
  id: string
  rule?: 'contains' | 'equals' | 'not_contains' | 'regex'
  value?: string
  variableName?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const ConditionNode = memo(({ data, isConnectable }: NodeProps & { data: ConditionNodeData }) => {
  return (
    <div className="group relative min-w-[300px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-amber-500 text-white">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Lógica Condicional</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Variable Selection */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Avaliar Variável:
          </label>
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border-2 border-lumen-navy focus-within:bg-white transition-all">
            <span className="text-amber-600 font-black text-[10px] tracking-tight">{"{{"}</span>
            <input
              className="nodrag nopan flex-1 bg-transparent border-0 p-0 text-xs font-mono font-bold text-lumen-navy outline-none placeholder:text-slate-300"
              placeholder="NOME_DA_VARIAVEL"
              value={data.variableName || ''}
              onChange={(e) => data.onChange?.(data.id, 'variableName', e.target.value)}
            />
            <span className="text-amber-600 font-black text-[10px] tracking-tight">{"}}"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Regra</label>
            <select
              className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-1.5 text-[10px] font-bold text-lumen-navy outline-none"
              value={data.rule || 'contains'}
              onChange={(e) => data.onChange?.(data.id, 'rule', e.target.value as any)}
            >
              <option value="contains">CONTÉM</option>
              <option value="equals">IGUAL A</option>
              <option value="not_contains">NÃO CONTÉM</option>
              <option value="regex">REGEX</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor</label>
            <input
              className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-1.5 text-[10px] font-bold text-lumen-navy outline-none"
              placeholder="ex: sim"
              value={data.value || ''}
              onChange={(e) => data.onChange?.(data.id, 'value', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="flex flex-col border-t-2 border-lumen-navy bg-slate-50/50 divide-y-2 divide-lumen-navy">
        <div className="flex items-center justify-between px-3 py-2.5 relative group/true">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center bg-emerald-500 border-2 border-lumen-navy text-white">
              <Check className="w-3 h-3" strokeWidth={4} />
            </div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Caminho (Verdadeiro)</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            isConnectable={isConnectable}
            className="!w-[6px] !h-[12px] !rounded-none !bg-emerald-500 !border-none !-right-[4px] group-hover/true:!h-[16px] transition-all"
          />
        </div>
        
        <div className="flex items-center justify-between px-3 py-2.5 relative group/false">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center bg-rose-500 border-2 border-lumen-navy text-white">
              <X className="w-3 h-3" strokeWidth={4} />
            </div>
            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Caminho (Falso)</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            isConnectable={isConnectable}
            className="!w-[6px] !h-[12px] !rounded-none !bg-rose-500 !border-none !-right-[4px] group-hover/false:!h-[16px] transition-all"
          />
        </div>
      </div>
    </div>
  )
})
