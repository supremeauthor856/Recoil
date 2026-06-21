import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as d3 from 'd3'
import { CharacterRelationship, NodeDatum, LinkDatum, RelationshipType } from '../types'

interface RelationshipGraphProps {
  verseId: string
  nodes: NodeDatum[]
  links: LinkDatum[]
  onNodeClick: (characterId: string) => void
  onLinkClick: (relationship: CharacterRelationship | null) => void
  selectedLinkId: string | null
  onNodePositionChange: (nodeId: string, x: number, y: number, pinned: boolean) => void
  filterType: RelationshipType | 'all'
  showLabels: boolean
}

export interface RelationshipGraphRef {
  fitAll: () => void
  resetPositions: () => void
  getSvgElement: () => SVGSVGElement | null
}

export const RelationshipGraph = forwardRef<RelationshipGraphRef, RelationshipGraphProps>(
  (
    {
      verseId,
      nodes,
      links,
      onNodeClick,
      onLinkClick,
      selectedLinkId,
      onNodePositionChange,
      filterType,
      showLabels,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null)
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

    // Expose control functions to parent
    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
      fitAll: () => {
        if (!svgRef.current || !zoomBehaviorRef.current || nodes.length === 0) return
        const svg = d3.select(svgRef.current)
        const width = svgRef.current.clientWidth || 800
        const height = svgRef.current.clientHeight || 600

        // Calculate bounding box of all nodes
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity
        nodes.forEach((n) => {
          const nx = n.x ?? 0
          const ny = n.y ?? 0
          if (nx < minX) minX = nx
          if (nx > maxX) maxX = nx
          if (ny < minY) minY = ny
          if (ny > maxY) maxY = ny
        })

        if (minX === Infinity) return

        const dx = maxX - minX
        const dy = maxY - minY
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2

        const padding = 64
        const scaleX = (width - padding * 2) / Math.max(dx, 1)
        const scaleY = (height - padding * 2) / Math.max(dy, 1)
        const scale = Math.max(0.15, Math.min(2.0, Math.min(scaleX, scaleY)))

        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-cx, -cy)

        svg.transition().duration(750).call(zoomBehaviorRef.current.transform, transform)
      },
      resetPositions: () => {
        localStorage.removeItem(`recoil-graph-positions-${verseId}`)
        nodes.forEach((n) => {
          n.fx = null
          n.fy = null
          onNodePositionChange(n.id, n.x ?? 0, n.y ?? 0, false)
        })
        if (simulationRef.current) {
          simulationRef.current.alpha(0.3).restart()
        }
      },
    }))

    // Setup ResizeObserver for responsive resizing
    useEffect(() => {
      if (!containerRef.current || !simulationRef.current) return

      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return
        const entry = entries[0]
        const { width, height } = entry.contentRect

        if (svgRef.current) {
          svgRef.current.setAttribute('width', String(width))
          svgRef.current.setAttribute('height', String(height))
        }

        if (simulationRef.current) {
          simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2))
          simulationRef.current.alpha(0.15).restart()
        }
      })

      observer.observe(containerRef.current)
      return () => {
        observer.disconnect()
      }
    }, [nodes])

    // Main D3 force layout rendering loop
    useEffect(() => {
      if (!svgRef.current || nodes.length === 0) return

      const svg = d3.select(svgRef.current)
      const width = svgRef.current.clientWidth || 800
      const height = svgRef.current.clientHeight || 600

      // Clear previous elements
      svg.selectAll('*').remove()

      // Defs for character profile clipping paths (circle avatars)
      const defs = svg.append('defs')
      nodes.forEach((node) => {
        if (node.reference_image_url) {
          const safeId = `clip_${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
          defs
            .append('clipPath')
            .attr('id', safeId)
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 22)
        }
      })

      // Group containing all layout nodes/links supporting zoom/pan transform
      const zoomContainer = svg.append('g').attr('class', 'zoom-container')

      // Configure zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.15, 4])
        .on('zoom', (event) => {
          zoomContainer.attr('transform', event.transform.toString())
        })

      zoomBehaviorRef.current = zoom
      svg.call(zoom)

      // Double-click on SVG background (not node/link) resets zoom/translation
      svg.on('dblclick', (event) => {
        if (event.target === svgRef.current) {
          svg.transition().duration(500).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
          )
        }
      })

      // Setup D3 Force Simulation
      const simulation = d3
        .forceSimulation<NodeDatum>(nodes)
        .force(
          'link',
          d3
            .forceLink<NodeDatum, LinkDatum>(links)
            .id((d) => d.id)
            .distance(150)
            .strength(0.4)
        )
        .force('charge', d3.forceManyBody<NodeDatum>().strength(-450))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<NodeDatum>().radius(38))

      simulationRef.current = simulation

      // 1. LINK ELEMENTS (Render first so they sit behind node items)
      const linkGroup = zoomContainer.append('g').attr('class', 'links-layer')

      const linkElements = linkGroup
        .selectAll<SVGLineElement, LinkDatum>('line.link-line')
        .data(links)
        .join('line')
        .attr('class', 'link-line')
        .attr('stroke', (d) => {
          if (filterType !== 'all' && d.relationship_type !== filterType) return '#1A1A24'
          return d.color
        })
        .attr('stroke-width', (d) => d.thickness)
        .attr('stroke-opacity', (d) => {
          if (filterType !== 'all' && d.relationship_type !== filterType) return 0.2
          if (selectedLinkId && d.id !== selectedLinkId) return 0.25
          return 0.85
        })
        .attr('stroke-linecap', 'round')
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation()
          onLinkClick(d.relationship)
        })

      // Easy click targets (Transparent wider hitlines overlays)
      const linkHitArea = linkGroup
        .selectAll<SVGLineElement, LinkDatum>('line.hit-area')
        .data(links)
        .join('line')
        .attr('class', 'hit-area')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 20)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation()
          onLinkClick(d.relationship)
        })

      // Dynamic hover labels on link midpoints
      const linkLabelGroup = zoomContainer.append('g').attr('class', 'link-labels-layer')

      const linkLabels = linkLabelGroup
        .selectAll<SVGTextElement, LinkDatum>('text.link-lbl')
        .data(links.filter((l) => l.dynamic_label))
        .join('text')
        .attr('class', 'link-lbl')
        .text((d) => d.dynamic_label ?? '')
        .attr('text-anchor', 'middle')
        .attr('fill', '#9090A8')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono, monospace)')
        .attr('dy', '-5')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      // Bind mouseover dynamic visual cues on the link elements
      linkHitArea
        .on('mouseover', (event, d) => {
          linkElements
            .filter((l) => l.id === d.id)
            .attr('stroke-opacity', 1)
            .attr('stroke-width', d.thickness + 1.5)

          if (d.dynamic_label) {
            linkLabels.filter((lbl) => lbl.id === d.id).style('opacity', 1)
          }
        })
        .on('mouseout', (event, d) => {
          const isSelected = selectedLinkId && d.id === selectedLinkId
          linkElements
            .filter((l) => l.id === d.id)
            .attr('stroke-opacity', () => {
              if (filterType !== 'all' && d.relationship_type !== filterType) return 0.2
              if (selectedLinkId && d.id !== selectedLinkId) return 0.25
              return 0.85
            })
            .attr('stroke-width', d.thickness)

          linkLabels.filter((lbl) => lbl.id === d.id).style('opacity', 0)
        })

      // 2. NODE ELEMENTS (Layered on top)
      const nodeGroup = zoomContainer.append('g').attr('class', 'nodes-layer')

      const nodeElements = nodeGroup
        .selectAll<SVGGElement, NodeDatum>('g.node-item')
        .data(nodes)
        .join('g')
        .attr('class', 'node-item')
        .style('cursor', 'pointer')

      // Outer backing frame circle
      nodeElements
        .append('circle')
        .attr('r', 22)
        .attr('fill', (d) => d.color)
        .attr('stroke', (d) => (d.id === selectedLinkId ? '#FFFFFF' : 'rgba(255,255,255,0.12)'))
        .attr('stroke-width', 2)

      // Character photo overlay (renders if url exists)
      nodeElements
        .filter((d) => !!d.reference_image_url)
        .append('image')
        .attr('x', -22)
        .attr('y', -22)
        .attr('width', 44)
        .attr('height', 44)
        .attr('clip-path', (d) => `url(#clip_${d.id.replace(/[^a-zA-Z0-9_-]/g, '_')})`)
        .attr('href', (d) => d.reference_image_url ?? '')
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          // If the profile portrait link fails to load, remove it and fallback to text initials
          d3.select(this).remove()
        })

      // Fallback single-letter initials text
      nodeElements
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#FFFFFF')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .text((d) => d.name.charAt(0).toUpperCase())
        .style('display', (d) => (d.reference_image_url ? 'none' : 'block'))

      // Descriptive character tag label under the circle
      const labelText = nodeElements
        .append('text')
        .attr('y', 33)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(230, 230, 245, 0.85)')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .text((d) => (d.name.length > 14 ? d.name.slice(0, 12) + '...' : d.name))
        .style('display', showLabels ? 'block' : 'none')

      // Role pill dot indicator overlay (placed on top-right quadrant)
      // Protagonist = Green, Antagonist = Red, else default transparent
      nodeElements
        .append('circle')
        .attr('cx', 15)
        .attr('cy', -15)
        .attr('r', 5)
        .attr('fill', (d) => {
          if (!d.narrative_role) return 'transparent'
          const role = d.narrative_role.toLowerCase()
          if (role.includes('protagonist')) return '#10B981' // Green
          if (role.includes('antagonist')) return '#EF4444' // Red
          return '#6B7280' // Muted grey for supporting/narrative roles
        })
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1)

      // Hover feedback handlers
      nodeElements
        .on('mouseenter', (event, d) => {
          d3.select(event.currentTarget as SVGGElement)
            .select('circle')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 3.5)
        })
        .on('mouseleave', (event, d) => {
          d3.select(event.currentTarget as SVGGElement)
            .select('circle')
            .attr('stroke', d.id === selectedLinkId ? '#FFFFFF' : 'rgba(255,255,255,0.12)')
            .attr('stroke-width', 2)
        })

      // Click node handler
      nodeElements.on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick(d.id)
      })

      // Drag behavior trigger
      const drag = d3
        .drag<SVGGElement, NodeDatum>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x ?? 0
          d.fy = d.y ?? 0
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          // Pin node in place on release
          onNodePositionChange(d.id, d.fx ?? 0, d.fy ?? 0, true)
        })

      nodeElements.call(drag)

      // Double-click item to unpin position constraint
      nodeElements.on('dblclick', (event, d) => {
        event.stopPropagation()
        d.fx = null
        d.fy = null
        simulation.alpha(0.3).restart()
        onNodePositionChange(d.id, d.x ?? 0, d.y ?? 0, false)
      })

      // Render tick step callback mapping
      simulation.on('tick', () => {
        linkElements
          .attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
          .attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
          .attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
          .attr('y2', (d) => (d.target as NodeDatum).y ?? 0)

        linkHitArea
          .attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
          .attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
          .attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
          .attr('y2', (d) => (d.target as NodeDatum).y ?? 0)

        linkLabels
          .attr('x', (d) => (((d.source as NodeDatum).x ?? 0) + ((d.target as NodeDatum).x ?? 0)) / 2)
          .attr('y', (d) => (((d.source as NodeDatum).y ?? 0) + ((d.target as NodeDatum).y ?? 0)) / 2)

        nodeElements.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      // Clicking outer background deselects any active links
      svg.on('click', (event) => {
        if (event.target === svgRef.current) {
          onLinkClick(null)
        }
      })

      return () => {
        simulation.stop()
      }
    }, [nodes, links, filterType, selectedLinkId, showLabels])

    return (
      <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0A0A0E]">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>
    )
  }
)

RelationshipGraph.displayName = 'RelationshipGraph'
