import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { getTagPalette } from '@/utils/constants'

/**
 * GraphView — Relationship graph showing connections between people across events.
 * People are nodes; edges connect people who share events.
 * Edge weight = number of shared events. Pure SVG, circular layout.
 */
const GraphView = memo(function GraphView({ events }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDimensions({ width: Math.max(width, 400), height: Math.max(height, 300) })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Build graph data
  const { nodes, edges, peopleEvents } = useMemo(() => {
    const peopleSet = new Map() // person -> { count, tags }
    const edgeMap = new Map() // "a|b" -> { weight, events }
    const pEvents = new Map() // person -> [event]

    for (const evt of events) {
      const people = evt.people || []
      for (const p of people) {
        if (!peopleSet.has(p)) peopleSet.set(p, { count: 0, tags: new Set() })
        const entry = peopleSet.get(p)
        entry.count++
        evt.tags?.forEach((t) => entry.tags.add(t))

        if (!pEvents.has(p)) pEvents.set(p, [])
        pEvents.get(p).push(evt)
      }

      // Create edges between all pairs of people in this event
      for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
          const key = [people[i], people[j]].sort().join('|')
          if (!edgeMap.has(key)) edgeMap.set(key, { weight: 0, events: [] })
          const edge = edgeMap.get(key)
          edge.weight++
          edge.events.push(evt)
        }
      }
    }

    // Layout: circular for now, simple and predictable
    const nodeList = []
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35
    const count = peopleSet.size

    let i = 0
    for (const [name, data] of peopleSet) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      nodeList.push({
        id: name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        count: data.count,
        primaryTag: [...data.tags][0] || 'general',
      })
      i++
    }

    const edgeList = []
    for (const [key, data] of edgeMap) {
      const [a, b] = key.split('|')
      edgeList.push({ source: a, target: b, weight: data.weight, events: data.events })
    }

    return { nodes: nodeList, edges: edgeList, peopleEvents: pEvents }
  }, [events, dimensions])

  const nodeMap = useMemo(() => {
    const m = new Map()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  const handleZoom = useCallback((delta) => {
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.5, Math.min(3, t.scale + delta)),
    }))
  }, [])

  const handleReset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest('.graph-node')) return
      isPanning.current = true
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
    },
    [transform]
  )

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return
    setTransform((t) => ({
      ...t,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault()
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1)
    },
    [handleZoom]
  )

  // Highlight edges connected to hovered node
  const highlightedEdges = useMemo(() => {
    if (!hoveredNode) return new Set()
    const s = new Set()
    for (const edge of edges) {
      if (edge.source === hoveredNode || edge.target === hoveredNode) {
        s.add(`${edge.source}|${edge.target}`)
      }
    }
    return s
  }, [hoveredNode, edges])

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set()
    const s = new Set()
    s.add(hoveredNode)
    for (const edge of edges) {
      if (edge.source === hoveredNode) s.add(edge.target)
      if (edge.target === hoveredNode) s.add(edge.source)
    }
    return s
  }, [hoveredNode, edges])

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <GitBranch size={32} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium">No people to graph</p>
        <p className="text-xs text-gray-400 mt-1">Add people to your events to see relationship connections</p>
      </div>
    )
  }

  const maxWeight = Math.max(...edges.map((e) => e.weight), 1)
  const hovered = hoveredNode ? nodeMap.get(hoveredNode) : null
  const hoveredEvents = hoveredNode ? peopleEvents.get(hoveredNode) || [] : []

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleZoom(0.2)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
        <span className="ml-2 text-[11px] text-gray-400">
          {nodes.length} {nodes.length === 1 ? 'person' : 'people'} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* SVG Graph */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-gray-200/60 bg-surface overflow-hidden select-none"
        style={{ height: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg width={dimensions.width} height={500} className="w-full h-full">
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {edges.map((edge) => {
              const source = nodeMap.get(edge.source)
              const target = nodeMap.get(edge.target)
              if (!source || !target) return null
              const key = `${edge.source}|${edge.target}`
              const isHighlighted = highlightedEdges.has(key)
              const opacity = hoveredNode
                ? isHighlighted
                  ? 0.6
                  : 0.08
                : 0.3
              const width = 1 + (edge.weight / maxWeight) * 3

              return (
                <line
                  key={key}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? 'var(--color-secondary)' : 'var(--color-gray-400)'}
                  strokeWidth={width}
                  opacity={opacity}
                  strokeLinecap="round"
                  style={{ transition: 'opacity 0.2s ease' }}
                />
              )
            })}

            {/* Edge weight labels (only when hovering a node) */}
            {hoveredNode &&
              edges
                .filter(
                  (e) =>
                    (e.source === hoveredNode || e.target === hoveredNode) && e.weight > 1
                )
                .map((edge) => {
                  const source = nodeMap.get(edge.source)
                  const target = nodeMap.get(edge.target)
                  if (!source || !target) return null
                  const mx = (source.x + target.x) / 2
                  const my = (source.y + target.y) / 2
                  return (
                    <g key={`label-${edge.source}-${edge.target}`}>
                      <circle cx={mx} cy={my} r={9} fill="var(--color-surface)" stroke="var(--color-gray-200)" strokeWidth={1} />
                      <text
                        x={mx}
                        y={my + 3.5}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill="var(--color-secondary)"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  )
                })}

            {/* Nodes */}
            {nodes.map((node) => {
              const palette = getTagPalette(node.primaryTag)
              const r = 8 + Math.min(node.count * 2, 12)
              const isHovered = hoveredNode === node.id
              const isConnected = connectedNodes.has(node.id)
              const dimmed = hoveredNode && !isConnected
              const nodeOpacity = dimmed ? 0.2 : 1

              return (
                <g
                  key={node.id}
                  className="graph-node cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ transition: 'opacity 0.2s ease' }}
                  opacity={nodeOpacity}
                >
                  {isHovered && (
                    <circle cx={node.x} cy={node.y} r={r + 6} fill={palette.bg} opacity={0.4} />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={isHovered ? palette.activeBg : palette.bg}
                    stroke={palette.activeBg}
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isHovered ? 700 : 500}
                    fill="var(--color-text-strong)"
                  >
                    {node.id}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill={isHovered ? 'white' : palette.activeBg}
                  >
                    {node.count}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Info panel */}
        {hovered && hoveredEvents.length > 0 && (
          <div className="absolute top-3 right-3 w-56 bg-surface backdrop-blur-sm rounded-lg border border-gray-200/60 shadow-lg p-3 z-20">
            <p className="font-semibold text-sm text-gray-900 mb-1">{hovered.id}</p>
            <p className="text-[11px] text-gray-400 mb-2">
              {hovered.count} event{hovered.count !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {hoveredEvents.slice(0, 8).map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-md px-2 py-1 text-xs text-gray-600 truncate"
                >
                  {evt.title}
                </div>
              ))}
              {hoveredEvents.length > 8 && (
                <p className="text-[10px] text-gray-400 px-2">
                  +{hoveredEvents.length - 8} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default GraphView
