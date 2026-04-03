import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // Sharp corners for the step path
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeWidth: 3, 
          stroke: '#0f172a', // lumen-navy
          transition: 'stroke 0.2s'
        }} 
        className="group-hover:stroke-lumen-teal transition-all"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="w-6 h-6 bg-white border-2 border-lumen-navy rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center text-lumen-navy hover:text-rose-600 hover:border-rose-600 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95"
            onClick={onEdgeClick}
            title="Excluir conexão"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
