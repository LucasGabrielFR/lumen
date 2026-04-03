import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Clock, X } from 'lucide-react'

type WaitNodeData = {
  id: string
  seconds?: number
  onChange?: (id: string, key: string, value: any) => void
  onDeleteNode?: (id: string) => void
}

export const WaitNode = memo(({ data, isConnectable }: NodeProps & { data: WaitNodeData }) => {
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
          <Clock className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Aguardar</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 text-center">
        <div className="relative inline-block w-full">
          <input
            type="number"
            min="1"
            max="3600"
            className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-3 text-center text-2xl font-black text-amber-600 outline-none focus:border-amber-500 transition-all rounded-none font-mono"
            placeholder="0"
            value={data.seconds || ''}
            onChange={(e) => data.onChange?.(data.id, 'seconds', parseInt(e.target.value) || 0)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest">seg</div>
        </div>
        <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Duração da pausa</p>
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
