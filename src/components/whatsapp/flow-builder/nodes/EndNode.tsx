import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { LogOut, X, AlertTriangle } from 'lucide-react'

type EndNodeData = {
  id: string
  text?: string
  onChange?: (id: string, key: string, value: string) => void
  onDeleteNode?: (id: string) => void
}

export const EndNode = memo(({ data, isConnectable }: NodeProps & { data: EndNodeData }) => {
  return (
    <div className="group relative min-w-[280px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4 overflow-hidden">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-rose-500 text-white">
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Encerrar Fluxo</span>
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
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Mensagem de Despedida (Opcional):
          </label>
          <textarea
            className="nodrag nopan w-full p-2.5 min-h-[100px] text-xs font-bold text-lumen-navy bg-slate-50 border-2 border-lumen-navy outline-none focus:bg-white transition-all resize-none placeholder:text-slate-300"
            placeholder="Ex: Obrigado por nos contatar!"
            value={data.text || ''}
            onChange={(e) => data.onChange?.(data.id, 'text', e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border-2 border-rose-500 text-rose-600">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={3} />
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Término do Processo</p>
            <p className="text-[8px] font-bold leading-tight uppercase opacity-80">
              A automação para aqui. A sessão do contato será encerrada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
