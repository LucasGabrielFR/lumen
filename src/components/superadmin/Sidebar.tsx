import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Church, MessageSquare, LogOut, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const Sidebar = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Paróquias', icon: Church, path: '/admin/parishes' },
    { label: 'Sugestões & Reports', icon: MessageSquare, path: '/admin/feedback' },
    { label: 'Configurações', icon: Settings, path: '/admin/settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-lumen-navy text-white shadow-xl flex flex-col">
      <div className="pt-12 pb-8 px-6 flex flex-col items-center">
        <div className="w-full h-40 relative flex items-center justify-center">
          <img src="/lumen-sem-back.png" alt="Lumen Logo" className="w-full h-full object-contain filter brightness-100 invert" />
        </div>
        <p className="text-[10px] text-lumen-accent uppercase font-black tracking-[0.3em] text-center opacity-60 mt-4">
          Portal Superadmin
        </p>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
          >
            <item.icon className="w-5 h-5 group-hover:text-lumen-gold group-hover:scale-110 transition-all" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  )
}
