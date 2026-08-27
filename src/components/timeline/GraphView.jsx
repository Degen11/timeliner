import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHotkeys } from 'react-hotkeys-hook'
import { GitBranch, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react'
import { getTagPalette, GRAPH_MAX_PEOPLE, MOTION_DURATION, EASE_OUT } from '@/utils/constants'
import { formatEventDate } from '@/utils/dateUtils'
import useTimelineStore from '@/store/useTimelineStore'
import EmptyState from '@/components/shared/EmptyState'

/**
 * GraphView — Relationship graph showing connections between people across events.
 * People are nodes; edges connect people who share events.
 * Edge weight = number of shared events. Pure SVG, circular layout.
 */
function GraphView({ events }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const [revealed, setRevealed] = useState(false)

  // Stagger nodes in on mount (fresh each time the view is switched to, since
  // GraphView unmounts otherwise) — driven by state, not a CSS animation, so
  // it never fights the hover/dim opacity transition below.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(raf)
  }, [])

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
  const { nodes, edges, peopleEvents, totalPeople } = (() => {
    let peopleSet = new Map() // person -> { count, tags }
    const edgeMap = new Map() // "a|b" -> { weight, events }
    const pEvents = new Map() // person -> [event]

    for (const evt of events) {
      for (const p of evt.people || []) {
        if (!peopleSet.has(p)) peopleSet.set(p, { count: 0, tags: new Set() })
        const entry = peopleSet.get(p)
        entry.count++
        evt.tags?.forEach((t) => entry.tags.add(t))

        if (!pEvents.has(p)) pEvents.set(p, [])
        pEvents.get(p).push(evt)
      }
    }

    // Cap to the most-connected people so the O(n²) edge pass stays bounded
    const totalPeople = peopleSet.size
    if (totalPeople > GRAPH_MAX_PEOPLE) {
      peopleSet = new Map(
        [...peopleSet.entries()]
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, GRAPH_MAX_PEOPLE)
      )
    }

    for (const evt of events) {
      const people = (evt.people || []).filter((p) => peopleSet.has(p))

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

    // Layout: circular
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

    return { nodes: nodeList, edges: edgeList, peopleEvents: pEvents, totalPeople }
  })()

  const nodeMap = (() => {
    const m = new Map()
    for (const n of nodes) m.set(n.id, n)
    return m
  })()

  // Zoom centered on mouse position — skip when scrolling inside the info panel
  const handleWheel = (e) => {
    if (e.target.closest('.graph-panel')) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setTransform((t) => {
      const newScale = Math.max(0.3, Math.min(4, t.scale + delta))
      const ratio = newScale / t.scale
      // Zoom toward mouse position
      const newX = mouseX - (mouseX - t.x) * ratio
      const newY = mouseY - (mouseY - t.y) * ratio
      return { x: newX, y: newY, scale: newScale }
    })
  }

  const handleZoom = (delta) => {
    setTransform((t) => {
      const newScale = Math.max(0.3, Math.min(4, t.scale + delta))
      const ratio = newScale / t.scale
      // Zoom toward the actual center of the container (not a hardcoded point,
      // which drifted the graph off-center on non-default sizes).
      const cx = dimensions.width / 2
      const cy = dimensions.height / 2
      const newX = cx - (cx - t.x) * ratio
      const newY = cy - (cy - t.y) * ratio
      return { x: newX, y: newY, scale: newScale }
    })
  }

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  const handleMouseDown = (e) => {
    if (e.target.closest('.graph-node') || e.target.closest('.graph-panel')) return
    isPanning.current = true
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
  }

  const handleMouseMove = (e) => {
    if (!isPanning.current) return
    setTransform((t) => ({
      ...t,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }))
  }

  const handleMouseUp = () => {
    isPanning.current = false
  }

  // Active node = clicked (pinned) or hovered
  const activeNode = selectedNode || hoveredNode

  // Highlight edges connected to active node
  const highlightedEdges = (() => {
    if (!activeNode) return new Set()
    const s = new Set()
    for (const edge of edges) {
      if (edge.source === activeNode || edge.target === activeNode) {
        s.add(`${edge.source}|${edge.target}`)
      }
    }
    return s
  })()

  const connectedNodes = (() => {
    if (!activeNode) return new Set()
    const s = new Set()
    s.add(activeNode)
    for (const edge of edges) {
      if (edge.source === activeNode) s.add(edge.target)
      if (edge.target === activeNode) s.add(edge.source)
    }
    return s
  })()

  // Close selected node on Escape
  useHotkeys('escape', () => setSelectedNode(null), { enabled: !!selectedNode })

  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No people to graph"
        description="Add people to your events to see relationship connections."
        hint="People who share events will be connected in the graph."
      />
    )
  }

  const maxWeight = Math.max(...edges.map((e) => e.weight), 1)
  const activeData = activeNode ? nodeMap.get(activeNode) : null
  const activeEvents = activeNode ? peopleEvents.get(activeNode) || [] : []

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleZoom(0.15)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
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
        <span className="ml-2 text-[11px] text-gray-400 tabular-nums">
          {Math.round(transform.scale * 100)}%
        </span>
        <span className="mx-1 text-gray-300">·</span>
        <span className="text-[11px] text-gray-400">
          {nodes.length} {nodes.length === 1 ? 'person' : 'people'} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
        </span>
      </div>

      {totalPeople > GRAPH_MAX_PEOPLE && (
        <p className="text-xs text-text-muted">
          Showing the {GRAPH_MAX_PEOPLE} most connected people of {totalPeople}
        </p>
      )}

      {/* SVG Graph */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.SLOW, ease: EASE_OUT }}
        className="relative rounded-xl border border-gray-200/60 bg-surface overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width={dimensions.width}
          height={500}
          className="w-full h-full"
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {edges.map((edge) => {
              const source = nodeMap.get(edge.source)
              const target = nodeMap.get(edge.target)
              if (!source || !target) return null
              const key = `${edge.source}|${edge.target}`
              const isHighlighted = highlightedEdges.has(key)
              // At rest, heavier connections read darker — not just thicker
              const opacity = activeNode
                ? isHighlighted
                  ? 0.7
                  : 0.06
                : 0.3 + 0.4 * (edge.weight / maxWeight)
              const width = 1 + (edge.weight / maxWeight) * 4

              return (
                <line
                  key={key}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? 'var(--color-secondary)' : 'var(--color-gray-500)'}
                  strokeWidth={width}
                  opacity={opacity}
                  strokeLinecap="round"
                  style={{ transition: 'opacity 0.3s ease, stroke 0.3s ease' }}
                />
              )
            })}

            {/* Edge weight labels (only when a node is active) */}
            {activeNode &&
              edges
                .filter(
                  (e) =>
                    (e.source === activeNode || e.target === activeNode) && e.weight > 1
                )
                .map((edge) => {
                  const source = nodeMap.get(edge.source)
                  const target = nodeMap.get(edge.target)
                  if (!source || !target) return null
                  const mx = (source.x + target.x) / 2
                  const my = (source.y + target.y) / 2
                  return (
                    <g key={`label-${edge.source}-${edge.target}`}>
                      <circle cx={mx} cy={my} r={10} fill="var(--color-surface)" stroke="var(--color-gray-200)" strokeWidth={1} />
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
            {nodes.map((node, i) => {
              const palette = getTagPalette(node.primaryTag)
              const r = 8 + Math.min(node.count * 2, 14)
              const isActive = activeNode === node.id
              const isConnected = connectedNodes.has(node.id)
              const dimmed = activeNode && !isConnected
              const nodeOpacity = dimmed ? 0.15 : 1

              return (
                // Outer group handles the one-time staggered mount reveal; inner group
                // handles the hover/dim opacity — kept separate so the entrance delay
                // never lingers on later hover interactions.
                <g
                  key={node.id}
                  opacity={revealed ? 1 : 0}
                  style={{
                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${Math.min(i, 15) * 20}ms`,
                  }}
                >
                <g
                  className="graph-node cursor-pointer"
                  onMouseEnter={() => {
                    if (!selectedNode) setHoveredNode(node.id)
                  }}
                  onMouseLeave={() => {
                    if (!selectedNode) setHoveredNode(null)
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedNode((prev) => (prev === node.id ? null : node.id))
                    setHoveredNode(null)
                  }}
                  style={{ transition: 'opacity 0.3s ease' }}
                  opacity={nodeOpacity}
                >
                  {/* Hover ring */}
                  {isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 6}
                      fill="none"
                      stroke={palette.activeBg}
                      strokeWidth={2}
                      opacity={0.4}
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={isActive ? palette.activeBg : palette.bg}
                    stroke={palette.activeBg}
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isActive ? 700 : 500}
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
                    fill={isActive ? 'white' : palette.activeBg}
                  >
                    {node.count}
                  </text>
                </g>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Info panel — click-pinned, scrollable */}
        {activeData && activeEvents.length > 0 && (
          <div
            className="graph-panel absolute top-3 right-3 w-64 bg-surface/95 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-lg z-20 flex flex-col"
            style={{ maxHeight: 'calc(100% - 24px)' }}
          >
            <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
              <div>
                <p className="font-semibold text-sm text-gray-900">{activeData.id}</p>
                <p className="text-[11px] text-gray-400">
                  {activeData.count} event{activeData.count !== 1 ? 's' : ''}
                  {connectedNodes.size > 1 && ` · ${connectedNodes.size - 1} connection${connectedNodes.size - 1 !== 1 ? 's' : ''}`}
                </p>
              </div>
              {selectedNode && (
                <button
                  onClick={() => {
                    setSelectedNode(null)
                    setHoveredNode(null)
                  }}
                  className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {activeEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    useTimelineStore.getState().openEventDetail(evt)
                  }}
                >
                  <span className="font-medium block leading-snug">{evt.title}</span>
                  <span className="text-[10px] text-gray-400">{formatEventDate(evt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default GraphView
