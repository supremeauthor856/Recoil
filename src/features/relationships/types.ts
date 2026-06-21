export interface CharacterRelationship {
  id: string
  verse_id: string
  character_a_id: string
  character_b_id: string
  relationship_type: RelationshipType
  dynamic_label: string | null
  dynamic_description: string | null
  // Bipolar dimensions: -5 to +5
  emotional_closeness: number
  conflict_level: number
  trust: number
  romantic_tension: number
  power_imbalance: number
  loyalty: number
  dependency: number
  fear_factor: number
  respect_level: number
  unspoken_tension: number
  // Unipolar dimensions: 0 to 10
  narrative_importance: number
  shared_history_weight: number
  // Evolution
  evolution_notes: string | null
  arc_stage: string | null
  tags: string[]
  created_at: number
  updated_at: number
}

export type RelationshipType =
  | 'romantic'
  | 'friendship'
  | 'rivalry'
  | 'family'
  | 'mentor'
  | 'acquaintance'
  | 'enemy'
  | 'neutral'
  | 'complex'
  | 'loyalty'
  | 'fear'
  | 'unspoken'

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'romantic','friendship','rivalry','family','mentor',
  'acquaintance','enemy','neutral','complex','loyalty','fear','unspoken'
]

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  romantic: 'Romantic',
  friendship: 'Friendship',
  rivalry: 'Rivalry',
  family: 'Family / Found Family',
  mentor: 'Mentor / Student',
  acquaintance: 'Acquaintance',
  enemy: 'Enemy',
  neutral: 'Neutral',
  complex: 'Complex',
  loyalty: 'Loyalty / Allegiance',
  fear: 'Fear Dynamic',
  unspoken: 'Unspoken Tension',
}

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  romantic: 'var(--color-rel-romantic)',
  friendship: 'var(--color-rel-friendship)',
  rivalry: 'var(--color-rel-rivalry)',
  family: 'var(--color-rel-family)',
  mentor: 'var(--color-rel-mentor)',
  acquaintance: 'var(--color-rel-acquaintance)',
  enemy: 'var(--color-rel-enemy)',
  neutral: 'var(--color-rel-neutral)',
  complex: 'var(--color-rel-complex)',
  loyalty: 'var(--color-rel-loyalty)',
  fear: 'var(--color-rel-fear)',
  unspoken: 'var(--color-rel-unspoken)',
}

// Hex fallbacks for use inside SVG (CSS variables don't work in SVG attributes)
export const RELATIONSHIP_COLORS_HEX: Record<RelationshipType, string> = {
  romantic: '#FF6B9D',
  friendship: '#60A5FA',
  rivalry: '#F87171',
  family: '#FFD166',
  mentor: '#4ADE80',
  acquaintance: '#6B7280',
  enemy: '#EF4444',
  neutral: '#9090A8',
  complex: '#C77DFF',
  loyalty: '#FB923C',
  fear: '#A855F7',
  unspoken: '#E879F9',
}

export interface IntensityDimension {
  key: keyof CharacterRelationship
  label: string
  bipolar: boolean   // true = -5 to +5, false = 0 to 10
  minLabel: string
  maxLabel: string
}

export const INTENSITY_DIMENSIONS: IntensityDimension[] = [
  {
    key: 'emotional_closeness',
    label: 'Emotional Closeness',
    bipolar: true,
    minLabel: 'Complete indifference',
    maxLabel: 'Deeply bonded',
  },
  {
    key: 'conflict_level',
    label: 'Conflict Level',
    bipolar: true,
    minLabel: 'Total peace',
    maxLabel: 'Constant war',
  },
  {
    key: 'trust',
    label: 'Trust',
    bipolar: true,
    minLabel: 'Absolute distrust',
    maxLabel: 'Total trust',
  },
  {
    key: 'romantic_tension',
    label: 'Romantic Tension',
    bipolar: true,
    minLabel: 'Actively repelled',
    maxLabel: 'Overwhelming tension',
  },
  {
    key: 'power_imbalance',
    label: 'Power Imbalance',
    bipolar: true,
    minLabel: 'B controls A completely',
    maxLabel: 'A controls B completely',
  },
  {
    key: 'narrative_importance',
    label: 'Narrative Importance',
    bipolar: false,
    minLabel: 'Background',
    maxLabel: 'Central to story',
  },
  {
    key: 'loyalty',
    label: 'Loyalty',
    bipolar: true,
    minLabel: 'Would betray without hesitation',
    maxLabel: 'Would die for them',
  },
  {
    key: 'dependency',
    label: 'Dependency',
    bipolar: true,
    minLabel: 'Actively avoids',
    maxLabel: 'Cannot function without',
  },
  {
    key: 'fear_factor',
    label: 'Fear Factor',
    bipolar: true,
    minLabel: 'Feels completely safe',
    maxLabel: 'Terrified',
  },
  {
    key: 'shared_history_weight',
    label: 'Shared History Weight',
    bipolar: false,
    minLabel: 'Just met',
    maxLabel: 'Lifelong entanglement',
  },
  {
    key: 'respect_level',
    label: 'Respect Level',
    bipolar: true,
    minLabel: 'Complete contempt',
    maxLabel: 'Deep reverence',
  },
  {
    key: 'unspoken_tension',
    label: 'Unspoken Tension',
    bipolar: true,
    minLabel: 'Total transparency',
    maxLabel: 'Suffocating unresolved tension',
  },
]

export type CreateRelationshipInput = {
  verse_id: string
  character_a_id: string
  character_b_id: string
  relationship_type: RelationshipType
  dynamic_label?: string
  dynamic_description?: string
}

// D3 graph node datum
export interface NodeDatum {
  id: string
  name: string
  reference_image_url: string | null
  is_oc: boolean
  is_au: boolean
  narrative_role: string | null
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  color: string
}

// D3 graph link datum
export interface LinkDatum {
  id: string
  source: string | NodeDatum
  target: string | NodeDatum
  relationship_type: RelationshipType
  dynamic_label: string | null
  thickness: number
  color: string
  relationship: CharacterRelationship
}
