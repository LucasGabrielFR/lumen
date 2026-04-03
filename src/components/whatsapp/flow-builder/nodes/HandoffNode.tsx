import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { UserPlus, X } from 'lucide-react'

type HandoffNodeData = {
  id: string
  text?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const HandoffNode = memo(({ data, isConnectable }: NodeProps & { data: HandoffNodeData }) => {
  return (
    <div className="group relative min-w-[260px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-orange-500">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-white">Transbordo Humano</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity rounded-none"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-3 space-y-3">
        <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase tracking-tight">
          Para a automação e transfere para um atendente humano.
        </p>

        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Mensagem Final</label>
          <textarea
            className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-2 text-xs font-bold text-slate-700 outline-none focus:ring-0 focus:border-orange-500 transition-all resize-none min-h-[60px] rounded-none shadow-inner"
            placeholder="Ex: Por favor, aguarde um momento..."
            value={data.text || ''}
            onChange={(e) => data.onChange?.(data.id, 'text', e.target.value)}
          />
        </div>

        <div className="bg-orange-50 border border-orange-200/50 p-2">
          <p className="text-[8px] font-black text-orange-700 uppercase tracking-widest italic">
            Variáveis como {`{{nome}}`} são suportadas.
          </p>
        </div>
      </div>
    </div>
  )
})
