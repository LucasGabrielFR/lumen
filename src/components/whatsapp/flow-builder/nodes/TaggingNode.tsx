import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Tag, X } from 'lucide-react'

type TaggingNodeData = {
  id: string
  tags?: string[]
  topic?: string
  onChange?: (id: string, key: string, value: any) => void
  onDeleteNode?: (id: string) => void
}

export const TaggingNode = memo(({ data, isConnectable }: NodeProps & { data: TaggingNodeData }) => {
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    data.onChange?.(data.id, 'tags', tags)
  }

  return (
    <div className="group relative min-w-[300px] bg-slate-100 border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4 overflow-hidden">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-lumen-navy">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-lumen-teal shadow-sm" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Etiquetar Contato</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/5 hover:bg-white/20 text-white/60 hover:text-white transition-all rounded-sm"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-5 bg-white/40">
        {/* Tags */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-lumen-navy/60 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-lumen-teal rounded-full animate-pulse" />
            Tags (separadas por vírgula):
          </label>
          <div className="relative bg-white border border-lumen-navy/10 group-focus-within:border-lumen-teal transition-all duration-300 rounded-sm">
            <input
              className="nodrag nopan w-full p-2.5 text-xs font-bold text-lumen-navy bg-transparent border-0 outline-none placeholder:text-slate-400"
              placeholder="vendas, prioridade, urgente..."
              value={data.tags?.join(', ') || ''}
              onChange={handleTagChange}
            />
          </div>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-lumen-navy/60 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Assunto Principal:
          </label>
          <div className="relative bg-white border border-lumen-navy/10 group-focus-within:border-amber-500 transition-all duration-300 rounded-sm">
            <input
              className="nodrag nopan w-full p-2.5 text-xs font-bold text-lumen-navy bg-transparent border-0 outline-none placeholder:text-slate-400"
              placeholder="Ex: Batismo, Casamento..."
              value={data.topic || ''}
              onChange={(e) => data.onChange?.(data.id, 'topic', e.target.value)}
            />
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
