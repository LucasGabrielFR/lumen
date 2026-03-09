import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, Edit } from 'lucide-react'
import type { Task } from './KanbanBoard'

interface Props {
  task: Task
  isOverlay?: boolean
  onClick?: (task: Task) => void
}

export const KanbanTask = ({ task, isOverlay, onClick }: Props) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    // Ensure fixed width during overlay to prevent cursor offset issues
    width: isOverlay ? '318px' : 'auto', 
  }

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="h-28 border-2 border-lumen-navy/20 border-dashed rounded-2xl bg-white/50 opacity-40 mb-3"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group mb-3 cursor-grab ${isOverlay ? 'cursor-grabbing shadow-2xl ring-2 ring-lumen-navy scale-[1.03] rotate-2' : ''}`}
    >
      <div className="flex gap-2 flex-wrap mb-3">
        {task.tags && task.tags.map(tag => (
          <span 
             key={tag} 
             className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-lumen-navy/5 text-lumen-navy"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-start">
        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2 group-hover:text-lumen-teal transition-colors flex-1 pr-2">
          {task.title}
        </h4>
        {!isOverlay && onClick && (
          <button 
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation() // Prevent dragging when clicking the edit button
              onClick(task)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-lumen-navy hover:bg-slate-100 rounded transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed w-full">
          {task.description}
        </p>
      )}

      {task.description && (
        <div className="flex items-center justify-between text-slate-400 mt-2">
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 hover:text-slate-600 transition-colors">
               <AlignLeft className="w-3.5 h-3.5" />
             </div>
           </div>
        </div>
      )}
    </div>
  )
}
