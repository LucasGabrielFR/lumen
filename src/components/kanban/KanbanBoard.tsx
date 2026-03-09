import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Loader2 } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanTask } from './KanbanTask'
import { TaskModal } from './TaskModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export type Task = {
  id: string
  column_id: string
  title: string
  description: string | null
  tags: string[] | null
  order: number
}

export type Column = {
  id: string
  title: string
  order: number
}

export const KanbanBoard = () => {
  const { profile } = useAuth()
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  useEffect(() => {
    if (profile?.parish_id) {
      fetchKanbanData()
    }
  }, [profile?.parish_id])

  const fetchKanbanData = async () => {
    try {
      if (!profile?.parish_id) return

      // Fetch Columns
      const { data: colsData, error: colsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('order', { ascending: true })
      
      if (colsError) throw colsError

      // Se não tem colunas, crie as padrões para a paróquia
      if (!colsData || colsData.length === 0) {
        const defaultCols = [
          { parish_id: profile.parish_id, title: 'A Fazer', order: 0 },
          { parish_id: profile.parish_id, title: 'Em Andamento', order: 1 },
          { parish_id: profile.parish_id, title: 'Concluído', order: 2 },
        ]
        
        const { data: generatedCols, error: genError } = await supabase
          .from('kanban_columns')
          .insert(defaultCols)
          .select()
        
        if (genError) throw genError
        setColumns((generatedCols as unknown as Column[]) || [])
      } else {
        setColumns(colsData as unknown as Column[])
      }

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('kanban_tasks')
        .select('*')
        .order('order', { ascending: true })

      if (tasksError) throw tasksError
      
      setTasks(tasksData as unknown as Task[] || [])

    } catch (error) {
      console.error('Error fetching kanban:', error)
    } finally {
      setLoading(false)
    }
  }

  const columnsId = useMemo(() => columns.map(c => c.id), [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column)
      return
    }

    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task)
      return
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null)
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // Reorder Columns
    if (active.data.current?.type === 'Column') {
      setColumns((columns) => {
        const activeIdx = columns.findIndex((col) => col.id === activeId)
        const overIdx = columns.findIndex((col) => col.id === overId)
        const newCols = arrayMove(columns, activeIdx, overIdx)
        
        // Persist new columns order
        updateColumnsOrder(newCols)
        return newCols
      })
    } else if (active.data.current?.type === 'Task') {
      // The actual reordering of tasks inside columns is handled by onDragOver for moving between columns
      // But we still persist the order here when drop completes and user releases mouse
      persistTasksOrder(tasks)
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Task'
    const isOverTask = over.data.current?.type === 'Task'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveTask) return

    // Drop over another task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIdx = tasks.findIndex(t => t.id === activeId)
        const overIdx = tasks.findIndex(t => t.id === overId)

        if (tasks[activeIdx].column_id !== tasks[overIdx].column_id) {
          tasks[activeIdx].column_id = tasks[overIdx].column_id
        }
        return arrayMove(tasks, activeIdx, overIdx)
      })
    }

    // Drop over empty column spot
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIdx = tasks.findIndex(t => t.id === activeId)
        if (tasks[activeIdx].column_id !== overId) {
           tasks[activeIdx].column_id = overId.toString()
           return arrayMove(tasks, activeIdx, activeIdx)
        }
        return tasks
      })
    }
  }

  const updateColumnsOrder = async (newCols: Column[]) => {
    try {
      const updates = newCols.map((col, index) => ({
        id: col.id,
        order: index
      }))
      for (const update of updates) {
         await supabase.from('kanban_columns').update({ order: update.order }).eq('id', update.id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const persistTasksOrder = async (currentTasks: Task[]) => {
    try {
      // Group tasks by column to maintain local bounds if needed, or just update all tasks that got shifted.
      const updates = currentTasks.map((t, index) => ({
        id: t.id,
        column_id: t.column_id,
        order: index
      }))

      for (const update of updates) {
        await supabase.from('kanban_tasks').update({ 
          order: update.order, 
          column_id: update.column_id 
        }).eq('id', update.id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenModal = (task?: Task | null, defaultColumnId?: string) => {
    if (task) {
      setTaskToEdit(task)
    } else {
      // New task
      setTaskToEdit({ id: 'temp-1', column_id: defaultColumnId || columns[0]?.id, title: '', description: '', tags: [], order: 0 } as unknown as Task)
    }
    setIsModalOpen(true)
  }

  const handleSaveModal = (savedTask: Task) => {
     setTasks(prev => {
       const exists = prev.find(t => t.id === savedTask.id)
       if (exists) {
         return prev.map(t => t.id === savedTask.id ? savedTask : t)
       }
       return [...prev, savedTask]
     })
  }

  const handleDeleteModal = async (taskId: string) => {
    try {
      if (!taskId.startsWith('temp-')) {
        await supabase.from('kanban_tasks').delete().eq('id', taskId)
      }
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Erro ao excluir demanda.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-lumen-navy animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-lumen-navy">Gestão de Demandas</h2>
          <p className="text-slate-500 font-medium">Gerencie as atividades, atendimentos e sacramentos da paróquia.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-lumen-teal text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30"
        >
          <Plus className="w-5 h-5" />
          Nova Demanda
        </button>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
        >
          <div className="flex gap-6 items-start h-full">
            <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
              {columns.map(col => (
                <KanbanColumn 
                  key={col.id} 
                  column={col} 
                  tasks={tasks.filter(t => t.column_id === col.id)} 
                  onEditTask={(t: Task) => handleOpenModal(t)}
                  onAddTask={(colId: string) => handleOpenModal(null, colId)}
                />
              ))}
            </SortableContext>
            <button className="flex-shrink-0 w-[350px] h-[60px] bg-slate-200/50 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center font-bold text-slate-500 transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Coluna
            </button>
          </div>

          <DragOverlay modifiers={[]}>
            {activeColumn && (
              <KanbanColumn 
                column={activeColumn} 
                tasks={tasks.filter(t => t.column_id === activeColumn.id)}
                isOverlay 
              />
            )}
            {activeTask && <KanbanTask task={activeTask} isOverlay />}
          </DragOverlay>
        </DndContext>
      </div>

      {isModalOpen && (
        <TaskModal 
          task={taskToEdit?.id?.startsWith('temp') ? null : taskToEdit}
          columns={columns}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
          onDelete={taskToEdit ? handleDeleteModal : undefined}
        />
      )}
    </>
  )
}
