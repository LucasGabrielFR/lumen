import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from '../parish/Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Bell, BellRing } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

  const [hasNewAlert, setHasNewAlert] = useState(false)
  const [alertPhone, setAlertPhone] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.parish_id) return;
    
    const channel = supabase.channel(`attendance_alerts:${profile.parish_id}`)
      .on(
        'broadcast',
        { event: 'new_attendance_request' },
        (payload) => {
          console.log('✅ Novo alerta de atendimento do Z-API!', payload)
          setHasNewAlert(true)
          setAlertPhone(payload.payload?.phone || 'Desconhecido')
          
          try {
            // Tentativa otimista de tocar alert.mp3 caso o admin suba futuramente
            const audio = new Audio('/alert.mp3') 
            audio.play().catch(() => {})
          } catch(e) {}
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.parish_id])

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

          <div className="flex items-center gap-6">
             <button 
               onClick={() => {
                 setHasNewAlert(false)
                 setAlertPhone(null)
               }}
               className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-lumen-navy transition-all flex items-center gap-2"
               title={hasNewAlert ? `Novo atendimento: ${alertPhone}` : 'Nenhuma nova notificação'}
             >
               {hasNewAlert ? (
                 <>
                   <BellRing className="w-6 h-6 text-lumen-gold animate-bounce" />
                   <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                   <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                 </>
               ) : (
                 <Bell className="w-5 h-5" />
               )}
             </button>

             <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
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
          </div>
        </header>
        <div className="p-8 w-full">
           <Outlet />
        </div>
      </main>
    </div>
  )
}
