import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Play, X } from 'lucide-react'

type StartNodeData = {
  id: string
  onDeleteNode?: (id: string) => void
}

export const StartNode = memo(({ data, isConnectable }: NodeProps & { data: StartNodeData }) => {
  return (
    <div className="group relative min-w-[240px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-emerald-500 text-white">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Início do Fluxo</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-5 flex flex-col items-center justify-center gap-4 text-center bg-emerald-50/30">
        <div className="relative">
          <div className="w-14 h-14 flex items-center justify-center bg-white border-2 border-lumen-navy text-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
            <Play className="w-7 h-7 fill-current ml-1" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 animate-pulse border-2 border-lumen-navy" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-black text-lumen-navy uppercase tracking-tight">Ponto de Entrada</p>
          <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase tracking-widest">
            A jornada começa aqui
          </p>
        </div>
      </div>

      {/* Node Handle - Source */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!w-[40px] !h-[6px] !rounded-none !bg-emerald-500 !border-none !-bottom-[4px] hover:!h-[10px] transition-all"
      />
    </div>
  )
})
