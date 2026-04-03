import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Tag, X, ArrowDown } from 'lucide-react'

type SetVariableNodeData = {
  id: string
  variableName?: string
  variableValue?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const SetVariableNode = memo(({ data, isConnectable }: NodeProps & { data: SetVariableNodeData }) => {
  return (
    <div className="group relative min-w-[200px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-amber-500">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Definir Variável</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Nome da Variável</label>
          <div className="font-mono flex items-center gap-1">
             <span className="text-amber-600 font-bold text-xs">{`{{`}</span>
             <input
                className="nodrag nopan flex-1 bg-slate-50 border-2 border-lumen-navy p-1.5 text-xs font-black text-amber-600 outline-none focus:border-amber-500 transition-all rounded-none uppercase placeholder:text-slate-300"
                placeholder="CHAVE"
                value={data.variableName || ''}
                onChange={(e) => data.onChange?.(data.id, 'variableName', e.target.value)}
              />
             <span className="text-amber-600 font-bold text-xs">{`}}`}</span>
          </div>
        </div>

        <div className="flex justify-center py-1">
          <ArrowDown className="w-3 h-3 text-slate-300" />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Novo Valor</label>
          <input
            className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-1.5 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 transition-all rounded-none"
            placeholder="Ex: verdadeiro ou {{OUTRA_VAR}}"
            value={data.variableValue || ''}
            onChange={(e) => data.onChange?.(data.id, 'variableValue', e.target.value)}
          />
          <p className="text-[7px] text-slate-400 italic">Dica: Use {`{{var}}`} para copiar outro valor</p>
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
