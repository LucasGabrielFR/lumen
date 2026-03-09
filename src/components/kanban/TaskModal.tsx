import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Task, Column } from './KanbanBoard'

interface Props {
  task?: Task | null
  columns: Column[]
  onClose: () => void
  onSave: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export const TaskModal = ({ task, columns, onClose, onSave, onDelete }: Props) => {
  const { profile } = useAuth()
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [tagsInput, setTagsInput] = useState(task?.tags?.join(', ') || '')
  const [columnId, setColumnId] = useState(task?.column_id || columns[0]?.id)
  const [loading, setLoading] = useState(false)

  // Avoid saving if no columns
  if (columns.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-black text-lumen-navy mb-4">Adicione uma coluna primeiro</h2>
          <button onClick={onClose} className="bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-xl">Voltar</button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.parish_id || !title.trim()) return

    setLoading(true)
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t)

    try {
      if (task?.id && !task.id.startsWith('temp-')) {
        // Update existing task
        const { data, error } = await supabase
          .from('kanban_tasks')
          .update({
            title,
            description,
            tags: tagsArray,
            column_id: columnId
          })
          .eq('id', task.id)
          .select()
          .single()

        if (error) throw error
        onSave(data as unknown as Task)
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('kanban_tasks')
          .insert({
            parish_id: profile.parish_id,
            column_id: columnId,
            title,
            description,
            tags: tagsArray,
            order: 0 // Ideally this should be computed
          })
          .select()
          .single()

        if (error) throw error
        onSave(data as unknown as Task)
      }
      onClose()
    } catch (err) {
      console.error('Error saving task:', err)
      alert('Erro ao salvar demanda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-lumen-navy">
              {task ? 'Editar Demanda' : 'Nova Demanda'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Preencha os detalhes para este cartão.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título da Demanda</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-lumen-navy/20 focus:border-lumen-navy transition-all"
                placeholder="Ex: Preparar documentação do casamento"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coluna</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-lumen-navy/20 focus:border-lumen-navy transition-all appearance-none"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-lumen-navy/20 focus:border-lumen-navy transition-all resize-none"
                rows={4}
                placeholder="Adicione detalhes, links ou anotações..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Badges / Categorias</label>
              <input 
                type="text" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-lumen-navy/20 focus:border-lumen-navy transition-all"
                placeholder="Casamento, Batismo, Urgente (separado por vírgula)"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
            <div>
              {task && onDelete && !task.id.startsWith('temp') && (
                <button 
                  type="button" 
                  onClick={() => window.confirm('Excluir esta demanda permanentemente?') && onDelete(task.id)}
                  className="px-6 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  Excluir Demanda
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading || !title.trim()}
                className="bg-lumen-navy text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lumen-blue transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {task ? 'Salvar Alterações' : 'Criar Demanda'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
