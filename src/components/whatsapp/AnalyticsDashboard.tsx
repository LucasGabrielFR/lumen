import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  MessageSquare, 
  UserCheck, 
  Zap, 
  Layers,
  Tag,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { subDays, startOfDay } from 'date-fns'
import { useState } from 'react'

interface AnalyticsDashboardProps {
  onBack?: () => void
  initialDateRange?: '7d' | '30d' | '90d' | 'all'
}

export const AnalyticsDashboard = ({ onBack, initialDateRange = '30d' }: AnalyticsDashboardProps) => {
  const { profile } = useAuth()
  const [dateRange, setDateRange] = useState(initialDateRange)

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['flow_analytics_metrics', profile?.parish_id, dateRange],
    queryFn: async () => {
      if (!profile?.parish_id) return null

      let query = supabase
        .from('flow_analytics_metrics')
        .select(`
          *,
          automation_flows (name)
        `)
        .eq('parish_id', profile.parish_id)

      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const startDate = startOfDay(subDays(new Date(), days)).toISOString()
        query = query.gte('date', startDate)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!profile?.parish_id
  })

  // Aggregations
  const totalMessages = metrics?.filter(m => m.metric_type === 'message_in').reduce((acc, m) => acc + (m.count || 0), 0) || 0
  const totalHandoffs = metrics?.filter(m => m.metric_type === 'handoff').reduce((acc, m) => acc + (m.count || 0), 0) || 0
  const totalCompleted = metrics?.filter(m => m.metric_type === 'session_completed').reduce((acc, m) => acc + (m.count || 0), 0) || 0
  const totalAutomated = metrics?.filter(m => !['message_in', 'handoff', 'session_completed'].includes(m.metric_type)).reduce((acc, m) => acc + (m.count || 0), 0) || 0

  // Top Flows
  const flowStats = metrics?.reduce((acc: any, m) => {
    const flowName = m.automation_flows?.name || 'Desconhecido'
    if (!acc[flowName]) acc[flowName] = 0
    acc[flowName] += m.count || 0
    return acc
  }, {})

  const sortedFlows = Object.entries(flowStats || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)

  // Top Topics (from tagging nodes)
  const topicStats = metrics?.reduce((acc: any, m) => {
    const topic = (m.metadata as any)?.topic || (m.metadata as any)?.last_topic
    if (topic) {
      if (!acc[topic]) acc[topic] = 0
      acc[topic] += m.count || 0
    }
    return acc
  }, {})

  const sortedTopics = Object.entries(topicStats || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumen-navy"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm group"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-lumen-navy">Dashboard Analítico</h2>
            <p className="text-slate-500 font-medium font-outfit uppercase tracking-widest text-[10px] mt-1">Estatísticas de Automação de WhatsApp</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: '7d', label: '7 Dias' },
            { id: '30d', label: '30 Dias' },
            { id: '90d', label: '90 Dias' },
            { id: 'all', label: 'Tudo' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dateRange === range.id 
                  ? 'bg-lumen-navy text-white' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={<MessageSquare className="w-6 h-6" />}
          label="Mensagens Recebidas"
          value={totalMessages}
          color="indigo"
          trend="+12%"
        />
        <MetricCard 
          icon={<Zap className="w-6 h-6" />}
          label="Ações Automatizadas"
          value={totalAutomated}
          color="amber"
          trend="+5%"
        />
        <MetricCard 
          icon={<UserCheck className="w-6 h-6" />}
          label="Encaminhados p/ Secretário"
          value={totalHandoffs}
          color="rose"
          trend="-2%"
        />
        <MetricCard 
          icon={<TrendingUp className="w-6 h-6" />}
          label="Sessões Finalizadas"
          value={totalCompleted}
          color="emerald"
          trend="+18%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Flows */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-lumen-navy flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Fluxos Mais Acionados
            </h3>
          </div>
          <div className="space-y-4">
            {sortedFlows.map(([name, count], i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 text-sm border border-slate-100">
                    {i + 1}
                  </div>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-lumen-navy">{count as number}</span>
                  <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${Math.min(100, ((count as number) / ((sortedFlows[0][1] as number) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {sortedFlows.length === 0 && (
              <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Sem dados ainda</p>
            )}
          </div>
        </div>

        {/* Top Topics */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-lumen-navy flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-500" />
              Assuntos Mais Procurados
            </h3>
          </div>
          <div className="space-y-4">
            {sortedTopics.map(([name, count], i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 text-sm border border-slate-100">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-lumen-navy">{count as number}</span>
                  <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${Math.min(100, ((count as number) / ((sortedTopics[0][1] as number) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
             {sortedTopics.length === 0 && (
              <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Sem dados ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({ icon, label, value, color, trend }: any) => {
  const isPositive = trend.startsWith('+')
  
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        color === 'indigo' ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' :
        color === 'amber' ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white' :
        color === 'rose' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' :
        'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
      }`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
            {trend}
          </div>
        </div>
        <h4 className="text-3xl font-black text-slate-800">{value.toLocaleString()}</h4>
      </div>
    </div>
  )
}
