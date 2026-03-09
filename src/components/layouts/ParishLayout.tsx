import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '../parish/Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export const ParishLayout = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-lumen-navy animate-spin" />
      </div>
    )
  }

  // Define allowed roles for the parish dashboard
  const allowedRoles = ['admin', 'user']

  if (!user || !profile || !profile.role || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-72 flex-1 overflow-x-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
          <div>
            <p className="text-sm font-black text-lumen-navy">
              {profile?.parishes?.name || 'Lumen Paróquia'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ambiente de Trabalho</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-sm font-black text-slate-800 leading-none">{profile?.full_name}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                 {profile?.role === 'admin' ? 'Administrador' : 'Agente Paroquial'}
               </p>
             </div>
             <div className="w-10 h-10 bg-lumen-navy rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-lumen-navy/20">
               {profile?.full_name?.charAt(0) || 'U'}
             </div>
          </div>
        </header>
        <div className="p-8 w-full">
           <Outlet />
        </div>
      </main>
    </div>
  )
}
