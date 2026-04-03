import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { ListFilter, Plus, X, ArrowRight } from 'lucide-react'

type OptionData = {
  id: string
  label: string
}

type OptionNodeData = {
  id: string
  text?: string
  displayType?: 'list' | 'buttons'
  invalidMessage?: string
  options?: OptionData[]
  onChange?: (id: string, key: string, value: string) => void
  onOptionChange?: (id: string, optId: string, label: string) => void
  onAddOption?: (id: string) => void
  onRemoveOption?: (id: string, optId: string) => void
  onDeleteNode?: (id: string) => void
}

export const OptionNode = memo(({ data, isConnectable }: NodeProps & { data: OptionNodeData }) => {
  const options = data.options || []

  return (
    <div className="group relative min-w-[340px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-lumen-teal text-white">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Múltiplas Opções</span>
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
        {/* Menu Configuration */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Título do Menu / Pergunta:
            </label>
            <input
              className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-2 text-xs font-bold text-lumen-navy outline-none focus:bg-white"
              placeholder="Ex: Escolha um departamento:"
              value={data.text || ''}
              onChange={(e) => data.onChange?.(data.id, 'text', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tipo de Exibição</label>
              <select
                className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-1.5 text-[10px] font-bold text-lumen-navy outline-none"
                value={data.displayType || 'list'}
                onChange={(e) => data.onChange?.(data.id, 'displayType', e.target.value as any)}
              >
                <option value="list">LISTA NUMERADA</option>
                <option value="buttons">BOTÕES INTERATIVOS</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mensagem de Erro</label>
              <input
                className="nodrag nopan w-full bg-slate-50 border-2 border-lumen-navy p-1.5 text-[10px] font-bold text-lumen-navy outline-none"
                placeholder="Ex: Opção inválida"
                value={data.invalidMessage || ''}
                onChange={(e) => data.onChange?.(data.id, 'invalidMessage', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 border-t-2 border-slate-100 pt-4">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Configurar Caminhos:
          </label>
          <div className="space-y-2">
            {options.map((opt: OptionData, index: number) => (
              <div key={opt.id} className="relative group/opt flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center bg-lumen-navy text-[10px] font-black text-white border-2 border-lumen-navy">
                  {index + 1}
                </div>
                <input
                  className="nodrag nopan flex-1 bg-white border-2 border-lumen-navy py-1 px-3 text-[10px] font-bold text-lumen-navy outline-none focus:border-lumen-teal"
                  placeholder={`Rótulo da Opção`}
                  value={opt.label || ''}
                  onChange={(e) => data.onOptionChange?.(data.id, opt.id, e.target.value)}
                />
                <button 
                  onClick={() => data.onRemoveOption?.(data.id, opt.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <Handle
                  type="source"
                  position={Position.Right}
                  id={opt.id}
                  isConnectable={isConnectable}
                  className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-right-[4px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => data.onAddOption?.(data.id)}
            className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-lumen-teal bg-lumen-teal/5 border-2 border-dashed border-lumen-teal/30 hover:border-lumen-teal hover:bg-lumen-teal/10 transition-all"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Opção
          </button>
        </div>

        {/* Fallback Path */}
        <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between group/default">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Caminho Padrão (Erro)</span>
          </div>
          <div className="relative">
             <Handle
              type="source"
              position={Position.Right}
              id="default"
              isConnectable={isConnectable}
              className="!w-[6px] !h-[12px] !rounded-none !bg-slate-300 !border-none !-right-[4px] group-hover/default:!bg-lumen-navy transition-colors"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
