import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  User, 
  Sparkles, 
  X, 
  Loader2, 
  Trash2, 
  AlertCircle, 
  UserPlus, 
  ChevronRight,
  UserCheck,
  Bookmark
} from 'lucide-react'
import { getCharacters, createCharacter, updateCharacter, calculateProfileCompletion } from '../../../services/characterService'
import { getSubSeries } from '../../../services/verseService'
import { SubSeries, Character } from '../../../shared/types/database'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { useUIStore } from '../../../store/uiStore'
import { db } from '../../../services/db'
import { motion, AnimatePresence } from 'motion/react'

export function CharacterListPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  // State managers
  const [characters, setCharacters] = useState<Character[]>([])
  const [subSeriesList, setSubSeriesList] = useState<SubSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubSeries, setSelectedSubSeries] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedType, setSelectedType] = useState('all') // 'all', 'oc', 'canon'
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'completion'>('name')

  // Create character modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCharName, setNewCharName] = useState('')
  const [newCharSubSeries, setNewCharSubSeries] = useState('')
  const [newCharRole, setNewCharRole] = useState('')
  const [newCharSpecies, setNewCharSpecies] = useState('')
  const [newCharAge, setNewCharAge] = useState('')
  const [newCharIsOc, setNewCharIsOc] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Narrative role choices
  const narrativeRoles = [
    'Protagonist',
    'Antagonist',
    'Supporting',
    'Foil',
    'Catalyst',
    'Wildcard',
    'Mirror',
    'Mentor',
    'Comic Relief',
    'Love Interest',
    'Other'
  ]

  // Load data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [charsData, subSeriesData] = await Promise.all([
        getCharacters({ verseId }),
        getSubSeries(verseId)
      ])
      setCharacters(charsData)
      setSubSeriesList(subSeriesData)
    } catch (err: any) {
      console.error('Failed to load characters directory:', err)
      setError('Failed to load characters. Please refresh or try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (verseId) {
      fetchData()
    }
  }, [verseId])

  // Map sub-series IDs to names for easy lookup
  const subSeriesMap = useMemo(() => {
    return new Map(subSeriesList.map((s) => [s.id, s.name]))
  }, [subSeriesList])

  // Filter & Sort Logic
  const processedCharacters = useMemo(() => {
    return characters
      .filter((char) => {
        // Search query filter
        const query = searchQuery.toLowerCase().trim()
        if (query) {
          const nameMatch = char.name?.toLowerCase().includes(query)
          const speciesMatch = char.species?.toLowerCase().includes(query)
          const roleMatch = char.role?.toLowerCase().includes(query)
          if (!nameMatch && !speciesMatch && !roleMatch) return false
        }

        // Sub-series filter
        if (selectedSubSeries !== 'all') {
          if (char.sub_series_id !== selectedSubSeries) return false
        }

        // Role filter
        if (selectedRole !== 'all') {
          if (char.role !== selectedRole) return false
        }

        // Type filter
        if (selectedType !== 'all') {
          const isOc = (char as any).is_oc ?? false
          if (selectedType === 'oc' && !isOc) return false
          if (selectedType === 'canon' && isOc) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'recent') {
          return (b.updated_at || 0) - (a.updated_at || 0)
        }
        if (sortBy === 'completion') {
          const compA = calculateProfileCompletion(a)
          const compB = calculateProfileCompletion(b)
          return compB - compA
        }
        return 0
      })
  }, [characters, searchQuery, selectedSubSeries, selectedRole, selectedType, sortBy])

  // Handle Character Deletion
  const handleDeleteCharacter = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    e.preventDefault()

    if (confirm(`Are you sure you want to delete ${name}? This will remove their profile and all associated relationships permanently.`)) {
      try {
        // Delete relationships involving this character
        await Promise.all([
          db.character_relationships.where('character_a_id').equals(id).delete(),
          db.character_relationships.where('character_b_id').equals(id).delete()
        ])
        
        // Delete character profile
        await db.characters.delete(id)
        
        setCharacters(prev => prev.filter(c => c.id !== id))
        addToast({
          title: `Character Deleted: ${name} was successfully removed.`,
          type: 'success'
        })
      } catch (err) {
        console.error('Failed to delete character:', err)
        addToast({
          title: 'Delete Failed: An error occurred.',
          type: 'error'
        })
      }
    }
  }

  // Handle Character Creation
  const handleCreateCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCharName.trim()) {
      addToast({
        title: 'Validation Error: Character name is required.',
        type: 'error'
      })
      return
    }

    setIsCreating(true)
    try {
      // Create character structure
      const charId = await createCharacter({
        verse_id: verseId,
        name: newCharName.trim(),
        is_oc: newCharIsOc
      })

      // Update fields if they were supplied
      const updates: Partial<Character> & Record<string, any> = {}
      if (newCharSubSeries) updates.sub_series_id = newCharSubSeries
      if (newCharRole) updates.role = newCharRole
      if (newCharSpecies) updates.species = newCharSpecies.trim()
      if (newCharAge) updates.age = newCharAge.trim()

      if (Object.keys(updates).length > 0) {
        await updateCharacter(charId, updates)
      }

      addToast({
        title: `Character Created: ${newCharName} added!`,
        type: 'success'
      })

      // Reset states
      setNewCharName('')
      setNewCharSubSeries('')
      setNewCharRole('')
      setNewCharSpecies('')
      setNewCharAge('')
      setNewCharIsOc(true)
      setIsCreateOpen(false)

      // Navigate to the newly created character details
      navigate(`/verse/${verseId}/characters/${charId}`)
    } catch (err) {
      console.error('Failed to create character:', err)
      addToast({
        title: 'Creation Failed: Could not create character.',
        type: 'error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full select-none animate-fade-in text-[var(--color-text-primary)]">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Characters Directory
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Build, edit, and keep track of your universe's protagonists, antagonists, and supporting cast members.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="h-9 gap-1.5 self-start md:self-auto text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Character</span>
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-border-subtle)]/70 bg-[var(--color-bg-subtle)]/20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search bar */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              type="text"
              placeholder="Search by name, species or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Subseries filter dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedSubSeries}
              onChange={(e) => setSelectedSubSeries(e.target.value)}
              className="w-full h-9 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Sub-Series</option>
              {subSeriesList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role filter dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-9 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              {narrativeRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="oc">Original (OC)</option>
              <option value="canon">Canon / Alternate</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-9 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="recent">Sort: Recently Updated</option>
              <option value="completion">Sort: Profile Completion</option>
            </select>
          </div>

        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="w-full h-64 flex flex-col items-center justify-center font-mono text-xs text-[var(--color-text-secondary)]">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
          <span>LOADING CHARACTERS DIRECTORY...</span>
        </div>
      ) : error ? (
        <div className="w-full p-6 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      ) : processedCharacters.length === 0 ? (
        <div className="p-8 border border-dashed border-[var(--color-border-subtle)]/50 rounded-2xl text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="w-12 h-12 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">No Characters Found</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
              {searchQuery || selectedSubSeries !== 'all' || selectedRole !== 'all' || selectedType !== 'all'
                ? "No characters match the currently applied filters or search keywords."
                : "Your characters directory is empty. Begin crafting your cast of characters!"}
            </p>
          </div>
          {(!searchQuery && selectedSubSeries === 'all' && selectedRole === 'all' && selectedType === 'all') && (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs h-8 cursor-pointer"
            >
              Add First Character
            </Button>
          )}
        </div>
      ) : (
        /* Characters Grid list */
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {processedCharacters.map((char) => {
            const completion = calculateProfileCompletion(char)
            const avatarUrl = char.avatar_url || char.reference_image_url || null
            const isOc = (char as any).is_oc ?? false

            return (
              <Link
                key={char.id}
                to={`/verse/${verseId}/characters/${char.id}`}
                className="group relative flex flex-col justify-between p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/5 rounded-2xl transition-all duration-300 min-w-0"
              >
                
                {/* Upper row: Details & Avatar */}
                <div className="space-y-3 min-w-0">
                  <div className="flex gap-3 items-start min-w-0">
                    
                    {/* Avatar frame */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-[var(--color-border-subtle)]/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-950 border border-indigo-700/60 font-extrabold flex items-center justify-center text-lg text-indigo-300 uppercase shrink-0">
                        {char.name.charAt(0)}
                      </div>
                    )}

                    {/* Meta Names */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-indigo-400 transition-colors truncate">
                          {char.name}
                        </h3>
                        {isOc && (
                          <span className="shrink-0 inline-block px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase tracking-widest scale-95 origin-left">
                            OC
                          </span>
                        )}
                      </div>

                      {char.species && (
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5 capitalize">
                          {char.species} {char.age ? `· ${char.age}` : ''}
                        </p>
                      )}

                      {char.role && (
                        <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 capitalize mt-1.5">
                          {char.role}
                        </span>
                      )}
                    </div>

                    {/* Delete Quick action */}
                    <button
                      onClick={(e) => handleDeleteCharacter(e, char.id, char.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-[var(--color-text-muted)] hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete character profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Character snippet description if exists */}
                  {char.description && (
                    <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 h-8 leading-relaxed">
                      {char.description.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                </div>

                {/* Lower row: Subseries & profile completion */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]/20 space-y-2 select-none shrink-0">
                  
                  {/* Linked subseries info */}
                  {char.sub_series_id && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                      <Bookmark size={10} className="text-indigo-400" />
                      <span className="truncate">{subSeriesMap.get(char.sub_series_id)}</span>
                    </div>
                  )}

                  {/* Profile Completion percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-[var(--color-text-muted)]">
                      <span>Profile Completion</span>
                      <span>{completion}%</span>
                    </div>
                    <div className="h-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          completion < 30 ? 'bg-rose-500' : completion < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                </div>

              </Link>
            )
          })}
        </motion.div>
      )}

      {/* CREATE NEW CHARACTER MODAL DIALOG */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-2xl shadow-2xl flex flex-col"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]/20 bg-[var(--color-bg-subtle)]/40">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
                    New Character Record
                  </h2>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateCharacterSubmit} className="p-4 space-y-4">
                
                {/* Character Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
                    Character Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter character's name"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    className="h-9 text-xs"
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Narrative Role */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
                      Narrative Role
                    </label>
                    <select
                      value={newCharRole}
                      onChange={(e) => setNewCharRole(e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/80 rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      disabled={isCreating}
                    >
                      <option value="">Select role...</option>
                      {narrativeRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subseries */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
                      Sub-Series / Book
                    </label>
                    <select
                      value={newCharSubSeries}
                      onChange={(e) => setNewCharSubSeries(e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/80 rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      disabled={isCreating}
                    >
                      <option value="">None / Main</option>
                      {subSeriesList.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Species */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
                      Species / Race
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Elf, Human"
                      value={newCharSpecies}
                      onChange={(e) => setNewCharSpecies(e.target.value)}
                      className="h-9 text-xs"
                      disabled={isCreating}
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
                      Age
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. 21, Immortal"
                      value={newCharAge}
                      onChange={(e) => setNewCharAge(e.target.value)}
                      className="h-9 text-xs"
                      disabled={isCreating}
                    />
                  </div>

                </div>

                {/* Classification Switch / Buttons */}
                <div className="p-3 bg-[var(--color-bg-subtle)]/30 border border-[var(--color-border-subtle)]/20 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-[var(--color-text-primary)] block">Original Character (OC)</span>
                    <span className="text-[9px] text-[var(--color-text-muted)] block">Toggles original classification vs. canon/adapted</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCharIsOc(!newCharIsOc)}
                    disabled={isCreating}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                      newCharIsOc ? 'bg-indigo-500' : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        newCharIsOc ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]/20">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                    className="text-xs h-9 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isCreating || !newCharName.trim()}
                    className="text-xs h-9 font-semibold gap-1.5 cursor-pointer"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Create Character</span>
                      </>
                    )}
                  </Button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
