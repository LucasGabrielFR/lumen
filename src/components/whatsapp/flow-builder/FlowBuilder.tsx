import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  MiniMap
} from '@xyflow/react'
import type { Connection, Edge, Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MessageNode } from './nodes/MessageNode'
import { OptionNode } from './nodes/OptionNode'
import { ConditionNode } from './nodes/ConditionNode'
import { HandoffNode } from './nodes/HandoffNode'
import { EndNode } from './nodes/EndNode'
import { StartNode } from './nodes/StartNode'
import { InputNode } from './nodes/InputNode'
import { WaitNode } from './nodes/WaitNode'
import { SetVariableNode } from './nodes/SetVariableNode'
import { FindContactNode } from './nodes/FindContactNode'
import { SaveContactNode } from './nodes/SaveContactNode'
import { BusinessHoursNode } from './nodes/BusinessHoursNode'
import { TaggingNode } from './nodes/TaggingNode'
import { SubFlowNode } from './nodes/SubFlowNode'
import DeletableEdge from './DeletableEdge'
import { useAuth } from '../../../contexts/AuthContext'
import { 
  Play, 
  MessageSquare, 
  MessageCircleQuestion, 
  ListFilter, 
  GitBranch, 
  UserPlus, 
  Save, 
  DoorOpen, 
  Clock, 
  Tag, 
  Search,
  Settings,
  Layers,
  Activity,
  X,
  Maximize,
  Minimize,
  Plus
} from 'lucide-react'

// Define the custom node types for ReactFlow
const nodeTypes = {
  startNode: StartNode,
  messageNode: MessageNode,
  inputNode: InputNode,
  optionNode: OptionNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode,
  setVariableNode: SetVariableNode,
  findContactNode: FindContactNode,
  saveContactNode: SaveContactNode,
  handoffNode: HandoffNode,
  endNode: EndNode,
  businessHoursNode: BusinessHoursNode,
  taggingNode: TaggingNode,
  subFlowNode: SubFlowNode
}

const edgeTypes = {
  default: DeletableEdge
}

interface FlowBuilderNodeData extends Record<string, unknown> {
  id: string
  text?: string
  variableName?: string
  variableValue?: string
  seconds?: number
  options?: Array<{ id: string; label: string }>
  displayType?: 'list' | 'buttons'
  invalidMessage?: string
  rule?: string
  value?: string
  onChange?: (id: string, key: string, value: string) => void
  onAddOption?: (id: string) => void
  onOptionChange?: (id: string, optId: string, label: string) => void
  onRemoveOption?: (id: string, optId: string) => void
  onDeleteNode?: (id: string) => void
}

type FlowBuilderNode = Node<FlowBuilderNodeData>

type FlowBuilderProps = {
  initialNodes: FlowBuilderNode[]
  initialEdges: Edge[]
  onSave: (nodes: FlowBuilderNode[], edges: Edge[]) => void
  isActive?: boolean
  onActiveToggle?: (active: boolean) => void
  testPhone?: string
  setTestPhone?: (phone: string) => void
  isTesting?: boolean
  onTest?: (phone: string) => void
  triggerKeywords?: string[]
  onAddKeyword?: (kw: string) => void
  onRemoveKeyword?: (kw: string) => void
}

export function FlowBuilder({ 
  initialNodes, 
  initialEdges, 
  onSave, 
  isActive = false, 
  onActiveToggle,
  testPhone = '',
  setTestPhone,
  isTesting = false,
  onTest,
  triggerKeywords = [],
  onAddKeyword,
  onRemoveKeyword
}: FlowBuilderProps) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || [])
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newKW, setNewKW] = useState('')

  // Pass down changes for text nodes
  const onNodeDataChange = useCallback((id: string, key: string, val: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              [key]: val,
            },
          }
        }
        return node
      })
    )
  }, [setNodes])

  // Callbacks for options
  const onAddOption = useCallback((id: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const newOptionId = `opt_${Date.now()}`
          const currentOptions = Array.isArray(node.data.options) ? node.data.options : []
          return {
            ...node,
            data: {
              ...node.data,
              options: [...currentOptions, { id: newOptionId, label: `Nova Opção` }]
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  const onOptionChange = useCallback((id: string, optId: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentOptions = Array.isArray(node.data.options) ? node.data.options : []
          return {
            ...node,
            data: {
              ...node.data,
              options: currentOptions.map((o) => o.id === optId ? { ...o, label } : o)
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  const onRemoveOption = useCallback((id: string, optId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentOptions = Array.isArray(node.data.options) ? node.data.options : []
          return {
            ...node,
            data: {
              ...node.data,
              options: currentOptions.filter((o) => o.id !== optId)
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
  }, [setNodes, setEdges])

  const updateNodeDataHandlers = useCallback((node: FlowBuilderNode): FlowBuilderNode => ({
    ...node,
    data: {
      ...node.data,
      id: node.id,
      onChange: onNodeDataChange,
      onAddOption,
      onOptionChange,
      onRemoveOption,
      onDeleteNode: (id: string) => setNodeToDelete(id)
    }
  }), [onNodeDataChange, onAddOption, onOptionChange, onRemoveOption])

  // Attach handlers when nodes load
  useEffect(() => {
    setNodes((nds) => nds.map((node) => updateNodeDataHandlers(node)))
  }, [setNodes, updateNodeDataHandlers])

  // Add edges with animated effect
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: 2 } 
    }, eds)),
    [setEdges],
  )

  const addNode = (type: string) => {
    const id = `${type}_${Date.now()}`
    const position = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 }
    let newNode: FlowBuilderNode
    
    switch (type) {
      case 'startNode':
        newNode = { id, type, position, data: { id } }
        break
      case 'messageNode':
        newNode = { id, type, position, data: { id, text: '' } }
        break
      case 'inputNode':
        newNode = { id, type, position, data: { id, text: '', variableName: '' } }
        break
      case 'optionNode':
        newNode = { id, type, position, data: { id, text: '', options: [{ id: '1', label: 'Opção 1' }, { id: '2', label: 'Opção 2' }] } }
        break
      case 'conditionNode':
        newNode = { id, type, position, data: { id, rule: 'contains', value: '' } }
        break
      case 'waitNode':
        newNode = { id, type, position, data: { id, seconds: 5 } }
        break
      case 'setVariableNode':
        newNode = { id, type, position, data: { id, variableName: '', variableValue: '' } }
        break
      case 'findContactNode':
        newNode = { id, type, position, data: { id, variableName: 'paroquiano_existe' } }
        break
      case 'saveContactNode':
        newNode = { id, type, position, data: { id, nameVariable: 'nome_cliente' } }
        break
      case 'handoffNode':
        newNode = { id, type, position, data: { id, text: 'Um atendente humano aparecerá em breve.' } }
        break
      case 'endNode':
        newNode = { id, type, position, data: { id, text: 'Obrigado pelo seu contato! O atendimento foi encerrado.' } }
        break
      case 'businessHoursNode':
        newNode = { id, type, position, data: { id } }
        break
      case 'taggingNode':
        newNode = { id, type, position, data: { id, tags: [], topic: '' } }
        break
      case 'subFlowNode':
        newNode = { id, type, position, data: { id, subFlowId: '' } }
        break
      default:
        return
    }
    setNodes((nds) => nds.concat(updateNodeDataHandlers(newNode)))
  }

  return (
    <div className={`flex h-full w-full bg-slate-50 font-sans overflow-hidden transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[9999]' : 'relative'}`}>
      {/* Sidebar Rail */}
      <aside className="w-80 h-full bg-white border-r-4 border-lumen-navy flex flex-col z-20 shadow-[8px_0px_0px_0px_rgba(15,23,42,0.05)]">
        <div className="p-6 border-b-2 border-lumen-navy bg-lumen-teal/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lumen-teal border-2 border-lumen-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] rounded-none">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-black text-lumen-navy tracking-widest text-lg uppercase leading-none">Blocos</h2>
              <span className="text-[10px] text-lumen-teal/80 font-black uppercase tracking-[0.2em] mt-1">Biblioteca V1.0</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8 bg-slate-50/30">
          {/* Estrutura */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-emerald-500"></div>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Estrutura</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => addNode('startNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-emerald-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Play className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Início do Fluxo</span>
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-lumen-teal"></div>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Interação</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => addNode('messageNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-lumen-teal hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Mensagem Simples</span>
              </button>

              <button 
                onClick={() => addNode('inputNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-lumen-teal hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Capturar Entrada</span>
              </button>

              <button 
                onClick={() => addNode('optionNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-lumen-teal hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <ListFilter className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Múltiplas Opções</span>
              </button>
            </div>
          </div>

          {/* Fluxo (Específico de Admin/Intermediário) */}
          {(isAdmin) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4 w-1 bg-indigo-500"></div>
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Módulos</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => addNode('subFlowNode')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-indigo-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
                >
                  <Layers className="w-4 h-4" />
                  <span className="font-black text-[11px] uppercase tracking-wider">Chamar Sub-Fluxo</span>
                </button>
              </div>
            </div>
          )}

          {/* Lógica */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-amber-500"></div>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Lógica</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => addNode('conditionNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-amber-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <GitBranch className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Condicional (If)</span>
              </button>

              <button 
                onClick={() => addNode('waitNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-amber-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Clock className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Aguardar Delay</span>
              </button>

              <button 
                onClick={() => addNode('setVariableNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-amber-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Tag className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Definir Variável</span>
              </button>

              <button 
                onClick={() => addNode('businessHoursNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-cyan-600 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Clock className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Expediente Manual</span>
              </button>
            </div>
          </div>

          {/* Dados */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-amber-600"></div>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Dados</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => addNode('findContactNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-amber-600 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Search className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Buscar no Banco</span>
              </button>

              <button 
                onClick={() => addNode('saveContactNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-amber-600 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Save className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Salvar no Banco</span>
              </button>

              <button 
                onClick={() => addNode('taggingNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-lumen-navy hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <Tag className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Etiquetar Contato</span>
              </button>
            </div>
          </div>

          {/* Finalização */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-rose-500"></div>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Terminar</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => addNode('handoffNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Transbordo</span>
              </button>

              <button 
                onClick={() => addNode('endNode')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-lumen-navy hover:bg-rose-500 hover:text-white transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none"
              >
                <DoorOpen className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase tracking-wider">Encerrar Fluxo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t-2 border-lumen-navy bg-white">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status: Ok</span>
            </div>
            <span className="text-[9px] font-black text-slate-400">V1.2.4</span>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Superior Header */}
        <header className="h-20 bg-white border-b-4 border-lumen-navy px-8 flex items-center justify-between z-10 shadow-[0px_4px_0px_0px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-6">
            <div className="flex flex-col border-l-4 border-lumen-teal pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-lumen-teal uppercase tracking-[0.3em] leading-none">Editor de Fluxo</span>
                <span className="text-[9px] font-black bg-lumen-navy text-white px-1.5 py-0.5 rounded-none uppercase">Live</span>
              </div>
              <h1 className="text-xl font-black text-lumen-navy uppercase tracking-tighter leading-none">Atendimento Geral</h1>
            </div>
            <div className="hidden lg:flex items-center gap-8 ml-8">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Versão</span>
                <span className="text-[10px] font-black text-lumen-navy">1.2.4-STABLE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Último Backup</span>
                <span className="text-[10px] font-black text-lumen-navy uppercase">Há 5 minutos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2.5 bg-white border-2 border-lumen-navy text-lumen-navy hover:bg-slate-100 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group rounded-none uppercase flex items-center gap-2"
              title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="hidden sm:inline font-black text-[10px] tracking-widest">{isFullScreen ? "Sair" : "Expandir"}</span>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 p-2.5 text-lumen-navy hover:bg-slate-100 border-2 border-transparent hover:border-lumen-navy transition-all font-black text-[10px] uppercase tracking-widest rounded-none"
            >
              <Settings className="w-4 h-4" /> Configs
            </button>
            <div className="w-[2px] h-8 bg-slate-200" />
            <button 
              onClick={() => onSave(nodes, edges)}
              className="bg-lumen-teal text-white px-8 py-3 rounded-none font-black uppercase tracking-widest border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-xs"
            >
              <Save className="w-4 h-4" /> Salvar Projeto
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-slate-50"
          >
            <Background gap={20} color="#cbd5e1" />
            <Controls className="!bg-white !border-slate-200 !fill-slate-500 !shadow-xl !rounded-lg" />
            <MiniMap 
              style={{ height: 140, width: 200 }} 
              zoomable 
              pannable 
              className="!bg-white !border-4 !border-lumen-navy !shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] !rounded-none overflow-hidden !m-6" 
              maskColor="rgba(15, 23, 42, 0.1)"
              nodeColor={(n) => {
                if (n.type === 'startNode') return '#10b981';
                if (n.type === 'conditionNode' || n.type === 'waitNode') return '#f59e0b';
                if (n.type === 'endNode') return '#ef4444';
                return '#2dd4bf'; // lumen-teal matching nodes
              }}
              nodeStrokeWidth={4}
            />
          </ReactFlow>
        </div>
      </main>

      {/* Settings Drawer */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 bg-lumen-navy/40 backdrop-blur-sm z-[110] animate-fade-in"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l-4 border-lumen-navy z-[120] animate-slide-in-right shadow-[-16px_0px_0px_0px_rgba(15,23,42,0.1)] p-8">
            <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-lumen-navy text-white rounded-none">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-black text-xl text-lumen-navy uppercase tracking-tighter">Configurações</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 border-2 border-transparent hover:border-lumen-navy transition-all rounded-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-slate-50 border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-lumen-teal uppercase tracking-widest">Status da Automação</span>
                    <h4 className="text-lg font-black text-lumen-navy uppercase tracking-tighter">Fluxo Ativo</h4>
                  </div>
                  <button 
                    onClick={() => onActiveToggle?.(!isActive)}
                    className={`relative w-14 h-8 transition-colors duration-300 border-2 border-lumen-navy ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 h-6 w-6 bg-white border-2 border-lumen-navy transition-all duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'} shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]`} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                  {isActive 
                    ? "O fluxo está pronto e respondendo a novos contatos." 
                    : "O fluxo está pausado e não processará mensagens."}
                </p>
              </div>

              {/* Keywords Section */}
              <div className="p-6 bg-slate-50 border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-lumen-teal border-2 border-lumen-navy text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                     <Tag className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-lumen-teal uppercase tracking-widest leading-none">Ativação por</span>
                     <h4 className="font-black text-sm text-lumen-navy uppercase tracking-tighter mt-1">Palavras-Chave</h4>
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 mb-4">
                    {triggerKeywords.length === 0 && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Nenhuma palavra-chave configurada</p>
                    )}
                    {triggerKeywords.map((kw, i) => (
                       <span key={i} className="bg-white text-lumen-navy px-3 py-1.5 border-2 border-lumen-navy text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                          {kw}
                          <button 
                            onClick={() => onRemoveKeyword?.(kw)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                       </span>
                    ))}
                 </div>

                 <div className="relative flex">
                    <input 
                      type="text" 
                      placeholder="ADICIONAR KEYWORD..." 
                      className="w-full bg-white border-2 border-lumen-navy px-4 py-3 text-[10px] font-black text-slate-700 outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] placeholder:text-slate-300 focus:bg-lumen-teal/5 transition-all"
                      value={newKW}
                      onChange={(e) => setNewKW(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newKW) {
                          onAddKeyword?.(newKW)
                          setNewKW('')
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newKW) {
                          onAddKeyword?.(newKW)
                          setNewKW('')
                        }
                      }}
                      className="absolute right-0 top-0 h-full px-4 border-l-2 border-lumen-navy hover:bg-lumen-teal hover:text-white transition-all text-lumen-teal"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4 leading-relaxed">
                   USUÁRIOS QUE ENVIAREM QUALQUER UMA DESSAS PALAVRAS INICIARÃO ESTE FLUXO AUTOMATICAMENTE.
                 </p>
              </div>

              <div className="p-6 bg-amber-50 border-2 border-amber-500/50 shadow-[4px_4px_0px_0px_rgba(245,158,11,0.2)]">
                 <div className="flex items-center gap-3 mb-4">
                   <Play className="w-5 h-5 text-amber-600" />
                   <h4 className="font-black text-sm text-amber-900 uppercase tracking-tight">Disparar Teste</h4>
                 </div>
                 <div className="space-y-4">
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Número do WhatsApp (DDI + DDD + Número)</label>
                     <input 
                       type="text" 
                       placeholder="Ex: 5511999999999" 
                       className="w-full bg-white border-2 border-lumen-navy px-4 py-3 text-xs font-bold text-slate-700 focus:ring-0 outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                       value={testPhone}
                       onChange={(e) => setTestPhone?.(e.target.value)}
                     />
                   </div>
                   <button 
                     disabled={!testPhone || isTesting}
                     onClick={() => onTest?.(testPhone)}
                     className="w-full py-4 bg-amber-500 text-white font-black uppercase tracking-widest text-xs border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {isTesting ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <Play className="w-4 h-4 fill-current" />
                     )}
                     {isTesting ? 'Disparando...' : 'Disparar Agora'}
                   </button>
                 </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
               <button 
                 onClick={() => setShowSettings(false)}
                 className="w-full py-4 bg-lumen-navy text-white font-black uppercase tracking-widest text-xs border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none"
               >
                 Fechar Configurações
               </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {nodeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-lumen-navy/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none p-10 border-4 border-lumen-navy shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-500 border-2 border-lumen-navy text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-lumen-navy uppercase tracking-tighter">Remover Bloco?</h3>
            </div>
            
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed uppercase tracking-tight">
              Esta ação removerá permanentemente o nó e todas as conexões vinculadas. Esta operação é <span className="text-rose-600 underline">Irreversível</span>.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setNodeToDelete(null)}
                className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-lumen-navy border-2 border-lumen-navy font-black uppercase tracking-widest transition-all text-xs rounded-none"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (nodeToDelete) onDeleteNode(nodeToDelete)
                  setNodeToDelete(null)
                }}
                className="flex-1 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white border-2 border-lumen-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-black uppercase tracking-widest transition-all text-xs rounded-none"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
