import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { UserPlus, Save, X } from 'lucide-react'

type SaveContactNodeData = {
  id: string
  nameVariable?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const SaveContactNode = memo(({ data, isConnectable }: NodeProps & { data: SaveContactNodeData }) => {
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
          <UserPlus className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Salvar Contato</span>
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
        <div className="bg-slate-100 p-2 border border-dashed border-lumen-navy/20">
          <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Variável do Nome</label>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-amber-600 font-bold text-xs">{`{{`}</span>
            <input
              className="nodrag nopan flex-1 bg-transparent border-none p-0 text-xs font-black text-amber-600 outline-none placeholder:text-slate-300 uppercase"
              placeholder="VARIAVEL_NOME"
              value={data.nameVariable || ''}
              onChange={(e) => data.onChange?.(data.id, 'nameVariable', e.target.value)}
            />
            <span className="text-amber-600 font-bold text-xs">{`}}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 border border-amber-200/50">
          <Save className="w-3 h-3 text-amber-500" />
          <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Persistência Ativada</span>
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
