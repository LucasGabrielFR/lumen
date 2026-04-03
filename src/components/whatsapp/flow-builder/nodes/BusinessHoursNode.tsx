import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Clock, Check, X } from 'lucide-react'

type Schedule = {
  active: boolean
  start: string
  end: string
}

type BusinessHoursNodeData = {
  id: string
  schedule?: { [key: string]: Schedule }
  onChange?: (id: string, key: string, value: any) => void
  onDeleteNode?: (id: string) => void
}

const DAYS = [
  { id: '1', label: 'Segunda-feira' },
  { id: '2', label: 'Terça-feira' },
  { id: '3', label: 'Quarta-feira' },
  { id: '4', label: 'Quinta-feira' },
  { id: '5', label: 'Sexta-feira' },
  { id: '6', label: 'Sábado' },
  { id: '0', label: 'Domingo' },
]

export const BusinessHoursNode = memo(({ data, isConnectable }: NodeProps & { data: BusinessHoursNodeData }) => {
  const schedule = (data.schedule || DAYS.reduce((acc, day) => ({
    ...acc,
    [day.id]: { active: true, start: '08:00', end: '18:00' }
  }), {})) as { [key: string]: Schedule }

  const handleToggleDay = (dayId: string) => {
    const newSchedule = { ...schedule }
    newSchedule[dayId].active = !newSchedule[dayId].active
    data.onChange?.(data.id, 'schedule', newSchedule)
  }

  const handleTimeChange = (dayId: string, type: 'start' | 'end', value: string) => {
    const newSchedule = { ...schedule }
    newSchedule[dayId][type] = value
    data.onChange?.(data.id, 'schedule', newSchedule)
  }

  return (
    <div className="group relative min-w-[320px] bg-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none mb-4">
      {/* Node Handle - Target */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-[6px] !h-[12px] !rounded-none !bg-lumen-navy !border-none !-left-[4px]"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-lumen-navy bg-cyan-600 text-white">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Horário de Expediente</span>
        </div>
        
        <button 
          onClick={() => data.onDeleteNode?.(data.id)}
          className="p-1 bg-white/20 hover:bg-white/40 text-white transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
          Configure os horários de atendimento manuais para este nó.
        </p>
        
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day.id} className="flex items-center gap-2">
              <button
                onClick={() => handleToggleDay(day.id)}
                className={`w-4 h-4 border-2 border-lumen-navy transition-colors flex items-center justify-center ${
                  schedule[day.id].active ? 'bg-cyan-500' : 'bg-slate-200'
                }`}
              >
                {schedule[day.id].active && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
              </button>
              
              <span className={`text-[9px] font-bold min-w-[80px] ${schedule[day.id].active ? 'text-lumen-navy' : 'text-slate-400'}`}>
                {day.label}
              </span>

              {schedule[day.id].active && (
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="time"
                    className="nodrag nopan bg-slate-50 border-2 border-lumen-navy p-1 text-[10px] font-bold text-lumen-navy outline-none"
                    value={schedule[day.id].start}
                    onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                  />
                  <span className="text-[10px] font-bold text-lumen-navy">-</span>
                  <input
                    type="time"
                    className="nodrag nopan bg-slate-50 border-2 border-lumen-navy p-1 text-[10px] font-bold text-lumen-navy outline-none"
                    value={schedule[day.id].end}
                    onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="flex flex-col border-t-2 border-lumen-navy bg-slate-50/50 divide-y-2 divide-lumen-navy">
        <div className="flex items-center justify-between px-3 py-2.5 relative group/open">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center bg-emerald-500 border-2 border-lumen-navy text-white">
              <Clock className="w-3 h-3 text-white" />
            </div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Dentro do Expediente</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="open"
            isConnectable={isConnectable}
            className="!w-[6px] !h-[12px] !rounded-none !bg-emerald-500 !border-none !-right-[4px]"
          />
        </div>
        
        <div className="flex items-center justify-between px-3 py-2.5 relative group/closed">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center bg-rose-500 border-2 border-lumen-navy text-white">
              <X className="w-3 h-3" strokeWidth={4} />
            </div>
            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Fora do Expediente</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="closed"
            isConnectable={isConnectable}
            className="!w-[6px] !h-[12px] !rounded-none !bg-rose-500 !border-none !-right-[4px]"
          />
        </div>
      </div>
    </div>
  )
})
