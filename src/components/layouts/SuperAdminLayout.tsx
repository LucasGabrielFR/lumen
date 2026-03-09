import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '../superadmin/Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export const SuperAdminLayout = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!user || profile?.role !== 'superadmin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-x-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20">
               {profile?.full_name?.charAt(0) || 'S'}
             </div>
             <div>
               <p className="text-sm font-black text-slate-800 leading-none">{profile?.full_name}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Ativo</p>
             </div>
          </div>
        </header>
        <div className="p-4">
           <Outlet />
        </div>
      </main>
    </div>
  )
}
