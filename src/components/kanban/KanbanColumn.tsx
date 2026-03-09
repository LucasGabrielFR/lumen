import { useMemo } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Plus } from 'lucide-react'
import { KanbanTask } from './KanbanTask'
import type { Column, Task } from './KanbanBoard'

interface Props {
  column: Column
  tasks: Task[]
  isOverlay?: boolean
  onEditTask?: (task: Task) => void
  onAddTask?: (columnId: string) => void
}

export const KanbanColumn = ({ column, tasks, isOverlay, onEditTask, onAddTask }: Props) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  // Fixed width ensures no layout glitch during sorting
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    width: '350px' 
  }

  const tasksIds = useMemo(() => tasks.map(t => t.id), [tasks])

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[500px] border-2 border-lumen-navy/20 border-dashed rounded-3xl bg-slate-100/50 opacity-40 shrink-0"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`shrink-0 flex flex-col h-full bg-slate-100 rounded-[2rem] p-4 ${isOverlay ? 'shadow-2xl ring-2 ring-lumen-navy scale-[1.02] cursor-grabbing' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className={`flex items-center justify-between p-2 mb-4 cursor-grab ${isOverlay ? 'cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-black text-slate-700 text-lg leading-none">{column.title}</h3>
          <span className="bg-white text-slate-500 font-bold text-xs py-1 px-2 rounded-lg shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-700 transition-colors p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-4 flex flex-col kanban-scroll">
        <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanTask key={task.id} task={task} onClick={onEditTask} />
          ))}
        </SortableContext>
        
        {!isOverlay && onAddTask && (
          <button 
            type="button" 
            onClick={() => onAddTask(column.id)}
            className="w-full mt-2 bg-transparent hover:bg-white text-slate-500 hover:text-lumen-navy font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border-2 border-transparent hover:border-slate-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Adicionar Cartão
          </button>
        )}
      </div>
    </div>
  )
}
