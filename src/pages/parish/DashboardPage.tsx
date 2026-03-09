import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Clock 
} from 'lucide-react'
import { StickyNotes } from '../../components/parish/StickyNotes'

export const DashboardPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-black text-lumen-navy">Painel Central</h2>
        <p className="text-slate-500 font-medium">Benvindo ao sistema de gestão e atendimento digital da sua paróquia.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-indigo-500/10 transition-all">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
             <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-lumen-navy">0</h3>
            <p className="text-sm font-bold text-slate-400 capitalize">Demandas Hoje</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
             <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-lumen-navy">0</h3>
            <p className="text-sm font-bold text-slate-400 capitalize">Concluídas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-amber-500/10 transition-all">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
             <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-lumen-navy">0</h3>
            <p className="text-sm font-bold text-slate-400 capitalize">Pendentes</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-sky-500/10 transition-all">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all">
             <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-lumen-navy">0</h3>
            <p className="text-sm font-bold text-slate-400 capitalize">Paroquianos</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-lumen-navy/5">
           <StickyNotes />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm min-h-[300px]">
           <h3 className="text-xl font-black text-lumen-navy mb-6">Últimas Demandas</h3>
           <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <p>O quadro de demandas será integrado aqui.</p>
           </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm min-h-[300px]">
           <h3 className="text-xl font-black text-lumen-navy mb-6">Atividade do Chatbot</h3>
           <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <p>Métricas de mensagens via WhatsApp aparecerão aqui.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
