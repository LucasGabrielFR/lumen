import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, X, Loader2 } from 'lucide-react'
import type { Tables } from '../../types/database'

type Note = Tables<'parish_notes'>

const NOTE_COLORS = [
  'bg-amber-100',
  'bg-rose-100',
  'bg-emerald-100',
  'bg-sky-100',
  'bg-violet-100',
]

export const StickyNotes = () => {
  const { profile } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0])
  const [isAdding, setIsAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.parish_id) {
      fetchNotes()
    }
  }, [profile?.parish_id])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('parish_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Error fetching notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim() || !profile?.parish_id) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('parish_notes').insert({
        parish_id: profile.parish_id,
        user_id: profile.id,
        content: newNoteContent,
        color: selectedColor,
      })

      if (error) throw error
      
      setNewNoteContent('')
      setIsAdding(false)
      fetchNotes()
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Erro ao salvar nota.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Excluir esta nota?')) return
    
    try {
      const { error } = await supabase.from('parish_notes').delete().eq('id', id)
      if (error) throw error
      fetchNotes()
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-xl font-black text-lumen-navy">Lembretes Rápidos</h3>
         <button 
           onClick={() => setIsAdding(!isAdding)}
           className="w-10 h-10 bg-slate-100 hover:bg-lumen-navy hover:text-white rounded-full flex items-center justify-center transition-all"
         >
           <Plus className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
         </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddNote} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 mb-6 animate-in slide-in-from-top-4 fade-in">
           <textarea
             autoFocus
             value={newNoteContent}
             onChange={(e) => setNewNoteContent(e.target.value)}
             className={`w-full ${selectedColor} rounded-2xl p-4 text-slate-800 focus:outline-none resize-none placeholder:text-slate-400`}
             rows={3}
             placeholder="Escreva seu lembrete..."
             required
           />
           <div className="flex items-center justify-between mt-4">
             <div className="flex gap-2">
               {NOTE_COLORS.map(color => (
                 <button
                   key={color}
                   type="button"
                   onClick={() => setSelectedColor(color)}
                   className={`w-6 h-6 rounded-full ${color} border-2 transition-all ${selectedColor === color ? 'border-lumen-navy scale-110' : 'border-transparent'}`}
                 />
               ))}
             </div>
             <button
               type="submit"
               disabled={submitting}
               className="bg-lumen-navy text-white px-4 py-2 text-sm font-bold rounded-xl hover:bg-lumen-blue transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
             </button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {notes.map(note => (
          <div key={note.id} className={`${note.color || 'bg-amber-100'} p-5 rounded-3xl relative group shadow-sm hover:shadow-md transition-all`}>
            <button 
              onClick={() => handleDeleteNote(note.id)}
              className="absolute top-2 right-2 p-1.5 bg-black/5 hover:bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-slate-700" />
            </button>
            <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed break-words overflow-hidden">{note.content}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4">
              {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        ))}
        {notes.length === 0 && !isAdding && (
          <div className="col-span-full py-10 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-3xl">
            Nenhum lembrete salvo. Adicione um novo no botão acima.
          </div>
        )}
      </div>
    </div>
  )
}
