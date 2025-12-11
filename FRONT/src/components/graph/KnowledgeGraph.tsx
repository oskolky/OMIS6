import { useEffect, useRef, useState, useCallback } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: "person" | "organization" | "location" | "date" | "document" | "other";
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  label: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
}

const KnowledgeGraph = ({ nodes: initialNodes, links: initialLinks, width = 800, height = 600 }: KnowledgeGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getNodeColor = (type: GraphNode["type"]) => {
    switch (type) {
      case "person":
        return "hsl(var(--accent))";
      case "organization":
        return "hsl(var(--primary))";
      case "location":
        return "hsl(var(--warning))";
      case "date":
        return "hsl(var(--muted-foreground))";
      case "document":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--border))";
    }
  };

  useEffect(() => {
    const nodesCopy = initialNodes.map(n => ({ ...n }));
    const linksCopy = initialLinks.map(l => ({ ...l }));

    const simulation = forceSimulation(nodesCopy)
      .force("link", forceLink(linksCopy).id((d: any) => d.id).distance(120))
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(40));

    simulation.on("tick", () => {
      setNodes([...nodesCopy]);
      setLinks([...linksCopy]);
    });

    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialLinks, width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * scaleFactor, 0.3), 3),
    }));
  }, []);

  return (
    <div className="relative border border-border bg-card overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="28"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--border))"
            />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Links */}
          {links.map((link) => {
            const source = link.source as GraphNode;
            const target = link.target as GraphNode;
            if (!source.x || !source.y || !target.x || !target.y) return null;

            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            return (
              <g key={link.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  className="font-mono text-[10px] fill-muted-foreground select-none"
                >
                  {link.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            if (!node.x || !node.y) return null;
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedNode(isSelected ? null : node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node shape - sharp square */}
                <rect
                  x={-20}
                  y={-20}
                  width={40}
                  height={40}
                  fill={getNodeColor(node.type)}
                  stroke={isSelected || isHovered ? "hsl(var(--foreground))" : "transparent"}
                  strokeWidth={2}
                  className="transition-all duration-150"
                />
                
                {/* Node label */}
                <text
                  y={35}
                  textAnchor="middle"
                  className="font-mono text-xs fill-foreground select-none"
                >
                  {node.label.length > 15 ? node.label.slice(0, 12) + "..." : node.label}
                </text>

                {/* Type indicator */}
                <text
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-mono text-[10px] fill-background select-none font-bold"
                >
                  {node.type[0].toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }))}
          className="w-8 h-8 bg-background border border-border font-mono text-sm hover:bg-secondary transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 0.8 }))}
          className="w-8 h-8 bg-background border border-border font-mono text-sm hover:bg-secondary transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="px-3 h-8 bg-background border border-border font-mono text-xs hover:bg-secondary transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-background border border-border p-4 max-w-xs">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Выбранная сущность
          </p>
          <p className="font-mono text-sm font-medium">{selectedNode.label}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Тип: {selectedNode.type}
          </p>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-3 px-3 py-1 bg-secondary font-mono text-xs hover:bg-muted transition-colors"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-background/90 border border-border p-3">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Легенда
        </p>
        <div className="flex flex-col gap-1">
          {[
            { type: "person", label: "Персона" },
            { type: "organization", label: "Организация" },
            { type: "location", label: "Локация" },
            { type: "date", label: "Дата" },
            { type: "document", label: "Документ" },
          ].map(({ type, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3"
                style={{ backgroundColor: getNodeColor(type as GraphNode["type"]) }}
              />
              <span className="font-mono text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
