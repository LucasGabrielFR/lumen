import { KanbanBoard } from '../../components/kanban/KanbanBoard'

export const KanbanPage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <KanbanBoard />
    </div>
  )
}
