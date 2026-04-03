import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Search, X, Database } from 'lucide-react'

type FindContactNodeData = {
  id: string
  variableName?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const FindContactNode = memo(({ data, isConnectable }: NodeProps & { data: FindContactNodeData }) => {
  return (
    <div className="group relative min-w-[280px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
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
          <Search className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Buscar Contato (BD)</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-3">
        <div className="p-2.5 bg-slate-100 border border-dashed border-lumen-navy/20 space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-amber-600" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pesquisa no Banco</p>
          </div>
          <p className="text-[8px] font-bold text-slate-400 leading-tight">
            Verifica <span className="text-lumen-navy">Paroquianos</span> depois <span className="text-lumen-navy">Contatos WA</span>
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Armazenar Resultado Em:
          </label>
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-2 border-lumen-navy font-mono">
            <span className="text-amber-600 font-bold text-xs">{`{{`}</span>
            <input
              className="nodrag nopan flex-1 bg-transparent border-0 p-0 text-xs font-black text-amber-600 outline-none placeholder:text-slate-300 uppercase"
              placeholder="NOME_DA_VARIAVEL"
              value={data.variableName || ''}
              onChange={(e) => data.onChange?.(data.id, 'variableName', e.target.value)}
            />
            <span className="text-amber-600 font-bold text-xs">{`}}`}</span>
          </div>
          <p className="text-[8px] text-slate-400 italic">
             O nome encontrado será salvo em {`{{NOME_ENCONTRADO}}`}
          </p>
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
