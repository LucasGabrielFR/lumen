import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { SuperAdminLayout } from './components/layouts/SuperAdminLayout'
import { ParishesPage } from './pages/superadmin/ParishesPage'
import { FeedbackPage } from './pages/superadmin/FeedbackPage'
import { ParishLayout } from './components/layouts/ParishLayout'
import { DashboardPage as ParishDashboard } from './pages/parish/DashboardPage'
import { KanbanPage } from './pages/parish/KanbanPage'
import { AutomationPage } from './pages/parish/AutomationPage'
import { FlowsPage } from './pages/parish/FlowsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Superadmin Routes */}
          <Route path="/admin" element={<SuperAdminLayout />}>
            <Route index element={<div className="p-10 text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-6">
              <h1 className="text-4xl font-extrabold text-slate-800">Bem-vindo ao Portal Superadmin</h1>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Gerencie paróquias, controle instâncias e acompanhe feedbacks da plataforma Lumen a partir de um único lugar.</p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-6">
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
                    <h3 className="text-3xl font-black text-indigo-800">0</h3>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Paróquias Ativas</p>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                    <h3 className="text-3xl font-black text-emerald-800">0</h3>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">Feedback Pendente</p>
                 </div>
              </div>
            </div>} />
            <Route path="parishes" element={<ParishesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="settings" element={<div className="p-10 text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100"><h2 className="text-2xl font-bold">Configurações do Sistema</h2><p className="text-slate-500 mt-2">Personalize a plataforma global.</p></div>} />
          </Route>

          {/* Parish Routes */}
          <Route path="/parish" element={<ParishLayout />}>
            <Route index element={<ParishDashboard />} />
            <Route path="kanban" element={<KanbanPage />} />
            <Route path="automation" element={<AutomationPage />} />
            <Route path="automation/flows" element={<FlowsPage />} />
            {/* Future routes: members, settings */}
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
