import { useState, useEffect } from 'react'
import { MessageSquare, AlertCircle, CheckCircle2, User, Clock, Church } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'report' | 'suggestion'>('all')

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        profiles (full_name),
        parishes (name)
      `)
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching feedback:', error)
    else setFeedbacks(data || [])
    setLoading(false)
  }

  const handleUpdateStatus = async (id: string, status: 'under_review' | 'implemented' | 'closed') => {
    const { error } = await supabase
      .from('feedback')
      .update({ status: status as any })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
    } else {
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status } : f))
    }
  }

  const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.type === filter)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">
            Sugestões & Reports
          </h1>
          <p className="text-slate-500 mt-2">
            Central de feedback dos usuários da plataforma. Identifique melhorias e corrija bugs.
          </p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100/50">
          {(['all', 'suggestion', 'report'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === type 
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-600/10' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'all' ? 'Todos' : type === 'suggestion' ? 'Sugestão' : 'Report'}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg">Nenhum feedback encontrado.</p>
            </div>
          ) : (
            filteredFeedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-indigo-100 transition-all flex gap-6 group"
              >
                <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${
                  item.type === 'report' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                }`}>
                  {item.type === 'report' ? <AlertCircle className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
                        item.type === 'report' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.type === 'suggestion' ? 'Sugestão' : 'Bug Report'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-semibold">{item.profiles?.full_name || 'Desconhecido'}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Church className="w-3.5 h-3.5" />
                        <span className="font-semibold">{item.parishes?.name || 'Sistema Global'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed mb-6">
                    {item.content}
                  </p>

                  <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Status:</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'pending' ? 'bg-slate-200 text-slate-600' :
                        item.status === 'under_review' ? 'bg-indigo-100 text-indigo-700' :
                        item.status === 'implemented' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-800 text-white'
                      }`}>
                        {item.status === 'pending' ? 'Pendente' :
                         item.status === 'under_review' ? 'Em Análise' :
                         item.status === 'implemented' ? 'Implementado' :
                         'Arquivado'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <button
                         onClick={() => handleUpdateStatus(item.id, 'under_review')}
                         className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
                         title="Marcar em análise"
                       >
                         <Clock className="w-5 h-5" />
                       </button>
                       <button
                         onClick={() => handleUpdateStatus(item.id, 'implemented')}
                         className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"
                         title="Marcar como implementado"
                       >
                         <CheckCircle2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
