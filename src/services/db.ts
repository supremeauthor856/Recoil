import Dexie, { type Table } from 'dexie'
import { Verse, SubSeries } from '../features/verse/types'
import { Character } from '../shared/types/database'
import { CharacterRelationship } from '../features/relationships/types'
import { WritingPiece, Chapter } from '../features/writing/types'
import { WritingGuideline } from '../features/settings/types'

export class RecoilDatabase extends Dexie {
  verses!: Table<Verse, string>
  sub_series!: Table<SubSeries, string>
  characters!: Table<Character, string>
  character_relationships!: Table<CharacterRelationship, string>
  writing_pieces!: Table<WritingPiece, string>
  chapters!: Table<Chapter, string>
  writing_guidelines!: Table<WritingGuideline, string>

  constructor() {
    super('RecoilDatabase')
    this.version(1).stores({
      verses: 'id, updated_at',
      sub_series: 'id, verse_id, updated_at',
      characters: 'id, verse_id, sub_series_id, updated_at',
      character_relationships: 'id, verse_id, character_a_id, character_b_id, updated_at',
      writing_pieces: 'id, verse_id, sub_series_id, updated_at',
      chapters: 'id, writing_piece_id, updated_at',
      writing_guidelines: 'id, category, is_active, updated_at'
    })
  }
}

export const db = new RecoilDatabase()
