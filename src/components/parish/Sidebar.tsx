import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  KanbanSquare, 
  MessageSquare, 
  Users, 
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const MENU_ITEMS = [
  { path: '/parish', icon: LayoutDashboard, label: 'Painel Central', end: true },
  { path: '/parish/kanban', icon: KanbanSquare, label: 'Gestão de Demandas' },
  { path: '/parish/automation', icon: MessageSquare, label: 'Automação (Bot)' },
  { path: '/parish/members', icon: Users, label: 'Paroquianos' },
  { path: '/parish/settings', icon: Settings, label: 'Configurações' },
]

export const Sidebar = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-72 bg-lumen-navy text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-20 overflow-y-auto">
      <div className="p-8 pb-4 relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-2xl text-lumen-gold scale-150 transform rotate-12 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10 w-full mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0 shadow-lg">
            <img src="/lumen-sem-back.png" alt="Lumen Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h1 
              className="text-lg font-black tracking-tight truncate" 
              title={profile?.parishes?.name || 'Lumen'}
            >
              {profile?.parishes?.name || 'Lumen'}
            </h1>
            <p className="text-[9px] text-lumen-teal font-bold uppercase tracking-widest leading-none mt-1 truncate">
              {profile?.role === 'admin' ? 'Painel Administrativo' : 'Área de Atendimento'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4 relative z-10">
        <p className="px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Módulos</p>
        
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? 'bg-lumen-teal text-white shadow-lg shadow-lumen-teal/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10 relative z-10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-300 hover:bg-rose-500 hover:text-white transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  )
}

