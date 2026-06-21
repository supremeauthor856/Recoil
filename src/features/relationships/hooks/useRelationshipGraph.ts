import { useMemo } from 'react'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship, NodeDatum, LinkDatum, RELATIONSHIP_COLORS_HEX } from '../types'
import { calculateLinkThickness } from '../../../services/relationshipService'
import { PRESET_ICON_COLORS } from '../../verse/types'

function getColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PRESET_ICON_COLORS.length
  return PRESET_ICON_COLORS[index]
}

export function useRelationshipGraph(
  verseId: string,
  characters: Character[],
  relationships: CharacterRelationship[]
) {
  const storageKey = `recoil-graph-positions-${verseId}`

  const { nodes, links } = useMemo(() => {
    // 1. Get saved positions
    let savedPositions: Record<string, { x: number; y: number; pinned: boolean }> = {}
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        savedPositions = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error parsing saved graph positions:', e)
    }

    // 2. Map characters to NodeDatum
    const nodesMap: Record<string, NodeDatum> = {}
    const nodesList: NodeDatum[] = characters.map((char) => {
      const saved = savedPositions[char.id]
      const node: NodeDatum = {
        id: char.id,
        name: char.name,
        reference_image_url: char.avatar_url || char.reference_image_url || null,
        is_oc: (char as any).is_oc ?? false,
        is_au: (char as any).is_au ?? false,
        narrative_role: char.role || (char as any).narrative_role || null,
        color: getColorForName(char.name),
      }

      if (saved) {
        node.x = saved.x
        node.y = saved.y
        if (saved.pinned) {
          node.fx = saved.x
          node.fy = saved.y
        } else {
          node.fx = null
          node.fy = null
        }
      }

      nodesMap[char.id] = node
      return node
    })

    // 3. Map relationships to LinkDatum
    // Filter out relationships where characters don't exist in current characters set
    const charIds = new Set(characters.map((c) => c.id))
    const filteredRels = relationships.filter(
      (rel) => charIds.has(rel.character_a_id) && charIds.has(rel.character_b_id)
    )

    const linksList: LinkDatum[] = filteredRels.map((rel) => {
      const thickness = calculateLinkThickness(rel)
      return {
        id: rel.id,
        source: rel.character_a_id,
        target: rel.character_b_id,
        relationship_type: rel.relationship_type,
        dynamic_label: rel.dynamic_label,
        thickness,
        color: RELATIONSHIP_COLORS_HEX[rel.relationship_type] || '#9090A8',
        relationship: rel,
      }
    })

    return { nodes: nodesList, links: linksList }
  }, [characters, relationships, storageKey])

  const saveNodePosition = (nodeId: string, x: number, y: number, pinned: boolean) => {
    try {
      const saved = localStorage.getItem(storageKey)
      const positions = saved ? JSON.parse(saved) : {}
      positions[nodeId] = { x, y, pinned }
      localStorage.setItem(storageKey, JSON.stringify(positions))
    } catch (e) {
      console.error('Error saving node position:', e)
    }
  }

  const clearNodePositions = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error('Error clearing graph positions:', e)
    }
  }

  return {
    nodes,
    links,
    saveNodePosition,
    clearNodePositions,
  }
}
