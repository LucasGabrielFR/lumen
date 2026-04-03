import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { MessageSquare, X } from 'lucide-react'

type MessageNodeData = {
  id: string
  text?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const MessageNode = memo(({ data, isConnectable }: NodeProps & { data: MessageNodeData }) => {
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
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-lumen-teal">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Enviar Mensagem</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Conteúdo da Mensagem:
          </label>
          <div className="relative bg-slate-50 border-2 border-lumen-navy">
            <textarea
              className="nodrag nopan w-full p-2.5 min-h-[120px] text-xs font-bold text-lumen-navy bg-transparent border-0 outline-none resize-none placeholder:text-slate-300"
              placeholder="Digite sua mensagem aqui..."
              value={data.text || ''}
              onChange={(e) => data.onChange?.(data.id, 'text', e.target.value)}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-lumen-navy text-white text-[8px] font-black uppercase tracking-widest">
              {data.text?.length || 0} CARAC
            </div>
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
