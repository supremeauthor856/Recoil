import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Compass, 
  Plus, 
  Search, 
  Globe, 
  Shield, 
  Users, 
  BookOpen, 
  Layers, 
  Sparkles, 
  X, 
  CheckCircle, 
  Edit3, 
  Trash2, 
  ExternalLink 
} from 'lucide-react'
import { db } from '../../../services/db'
import { useUIStore } from '../../../store/uiStore'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import type { Character } from '../../../shared/types/database'

interface MapLocation {
  id: string
  verse_id: string
  name: string
  type: 'realm' | 'city' | 'dungeon' | 'landmark' | 'headquarters'
  description: string
  faction?: string
  danger_level: 'Safe' | 'Moderate' | 'Hazardous' | 'Lethal'
  x_coord: number // percentage 0-100
  y_coord: number // percentage 0-100
  linked_character_ids: string[]
}

export function VerseMapPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [locations, setLocations] = useState<MapLocation[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState<'realm' | 'city' | 'dungeon' | 'landmark' | 'headquarters'>('city')
  const [newLocDesc, setNewLocDesc] = useState('')
  const [newLocFaction, setNewLocFaction] = useState('')
  const [newLocDanger, setNewLocDanger] = useState<'Safe' | 'Moderate' | 'Hazardous' | 'Lethal'>('Safe')
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number }>({ x: 50, y: 50 })

  // Initial Mock Locations for new verse maps
  const defaultLocations: MapLocation[] = [
    {
      id: 'loc-1',
      verse_id: verseId,
      name: 'High Citadel of Eldoria',
      type: 'realm',
      description: 'The ancient capital city perched atop the crystalline peak of Mount Vael. seat of the Grand Council.',
      faction: 'Celestial Alliance',
      danger_level: 'Safe',
      x_coord: 35,
      y_coord: 28,
      linked_character_ids: []
    },
    {
      id: 'loc-2',
      verse_id: verseId,
      name: 'Shadowfen Swamps',
      type: 'dungeon',
      description: 'A perilous, fog-choked wetland infested with wild shadowbeasts and ancient forgotten ruins.',
      faction: 'The Unbound Clan',
      danger_level: 'Lethal',
      x_coord: 72,
      y_coord: 64,
      linked_character_ids: []
    },
    {
      id: 'loc-3',
      verse_id: verseId,
      name: 'Starlight Observatory',
      type: 'landmark',
      description: 'An ethereal arcane tower where stargazers map cosmic ley lines and predict future anomalies.',
      faction: 'Arcane Order',
      danger_level: 'Moderate',
      x_coord: 20,
      y_coord: 75,
      linked_character_ids: []
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const chars = await db.characters.where('verse_id').equals(verseId).toArray()
        setCharacters(chars)

        // Load saved map locations from localStorage or DB
        const saved = localStorage.getItem(`verse_map_${verseId}`)
        if (saved) {
          setLocations(JSON.parse(saved))
        } else {
          setLocations(defaultLocations)
          localStorage.setItem(`verse_map_${verseId}`, JSON.stringify(defaultLocations))
        }
      } catch (err) {
        console.error('Failed loading map data', err)
      }
    }
    if (verseId) loadData()
  }, [verseId])

  const saveLocationsToStore = (updated: MapLocation[]) => {
    setLocations(updated)
    localStorage.setItem(`verse_map_${verseId}`, JSON.stringify(updated))
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    
    setClickCoords({ x, y })
    setIsModalOpen(true)
  }

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim()) return

    const newLoc: MapLocation = {
      id: `loc-${Date.now()}`,
      verse_id: verseId,
      name: newLocName.trim(),
      type: newLocType,
      description: newLocDesc.trim(),
      faction: newLocFaction.trim(),
      danger_level: newLocDanger,
      x_coord: clickCoords.x,
      y_coord: clickCoords.y,
      linked_character_ids: []
    }

    const updated = [...locations, newLoc]
    saveLocationsToStore(updated)
    setSelectedLocation(newLoc)

    addToast({
      title: `Map Pin Created: ${newLoc.name}`,
      type: 'success'
    })

    setNewLocName('')
    setNewLocDesc('')
    setNewLocFaction('')
    setIsModalOpen(false)
  }

  const handleDeleteLocation = (id: string) => {
    if (confirm('Are you sure you want to delete this map location?')) {
      const updated = locations.filter(l => l.id !== id)
      saveLocationsToStore(updated)
      setSelectedLocation(null)
      addToast({
        title: 'Location deleted from map.',
        type: 'info'
      })
    }
  }

  const filteredLocations = locations.filter(loc => {
    if (filterType !== 'all' && loc.type !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q) || (loc.faction && loc.faction.toLowerCase().includes(q))
    }
    return true
  })

  const getDangerBadgeColor = (danger: string) => {
    switch (danger) {
      case 'Safe': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'Moderate': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      case 'Hazardous': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'Lethal': return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full select-none animate-fade-in text-[var(--color-text-primary)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass size={20} className="text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Interactive Verse Map & Geography
            </h1>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Map territories, landmarks, cities, and character presence across your universe canvas. Click anywhere on the map grid to place a new location pin!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setClickCoords({ x: 50, y: 50 })
              setIsModalOpen(true)
            }}
            className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Location Pin</span>
          </Button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)]/70 bg-[var(--color-bg-subtle)]/20">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              type="text"
              placeholder="Search map locations & factions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Pin Types</option>
            <option value="realm">Realms & Kingdoms</option>
            <option value="city">Cities & Towns</option>
            <option value="dungeon">Dungeons & Wilds</option>
            <option value="landmark">Landmarks & Towers</option>
            <option value="headquarters">Headquarters</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>{locations.length} Locations Mapped</span>
        </div>
      </div>

      {/* Main Map Visual Canvas & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map Surface (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden min-h-[480px] shadow-2xl flex flex-col justify-between select-none">
          
          {/* Top Map Overlay Grid Info */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 backdrop-blur-md">
            <Globe size={14} className="text-indigo-400" />
            <span className="font-mono font-bold uppercase tracking-wider">Verse Geography Canvas</span>
          </div>

          {/* Map Surface Grid Canvas */}
          <div 
            onClick={handleMapClick}
            className="relative w-full h-[480px] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] cursor-crosshair group overflow-hidden"
          >
            {/* Background Map Atmosphere styling */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-indigo-950/30 pointer-events-none" />

            {/* Render Pins */}
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id

              return (
                <div
                  key={loc.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedLocation(loc)
                  }}
                  style={{ left: `${loc.x_coord}%`, top: `${loc.y_coord}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group/pin"
                >
                  <div className={`relative flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'}`}>
                    
                    {/* Pin Beacon Effect */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 border-white text-white shadow-indigo-500/50 ring-4 ring-indigo-500/30' 
                        : 'bg-slate-900/90 border-indigo-400 text-indigo-300 hover:border-white'
                    }`}>
                      <MapPin size={16} />
                    </div>

                    {/* Label Tag */}
                    <div className={`mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-md border transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-400' 
                        : 'bg-slate-900/95 text-slate-200 border-slate-700/80 group-hover/pin:border-indigo-400'
                    }`}>
                      {loc.name}
                    </div>

                  </div>
                </div>
              )
            })}

            {/* Click to add instructions hint */}
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 pointer-events-none bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              CLICK ANYWHERE TO PLACE NEW PIN
            </div>
          </div>

        </div>

        {/* Selected Location Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm min-h-[480px] flex flex-col justify-between">
          {selectedLocation ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                    {selectedLocation.type}
                  </span>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {selectedLocation.name}
                  </h3>
                </div>

                <button 
                  onClick={() => handleDeleteLocation(selectedLocation.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete Map Pin"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {selectedLocation.description || 'No detailed lore description supplied for this territory.'}
              </p>

              {/* Faction & Danger Meta */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]/40">
                {selectedLocation.faction && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">Ruling Faction:</span>
                    <span className="font-bold text-indigo-400">{selectedLocation.faction}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">Threat Level:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDangerBadgeColor(selectedLocation.danger_level)}`}>
                    {selectedLocation.danger_level}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">Canvas Coords:</span>
                  <span className="font-mono text-[11px] text-slate-400">X: {selectedLocation.x_coord}% | Y: {selectedLocation.y_coord}%</span>
                </div>
              </div>

              {/* Connected Characters in region */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)]/40 space-y-2">
                <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] block">
                  Character Presence ({characters.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {characters.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/verse/${verseId}/characters/${c.id}`)}
                      className="px-2 py-1 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/60 rounded-lg text-[10px] font-semibold text-[var(--color-text-primary)] hover:border-indigo-500 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Users size={10} className="text-indigo-400" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  {characters.length === 0 && (
                    <span className="text-xs text-[var(--color-text-muted)] italic">No characters assigned to verse yet.</span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Select a Pin</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Click on any pin on the map surface to view territory details, threat level, and associated characters.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE LOCATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/80 rounded-2xl shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]/40">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase">
                  Add New Map Location Pin
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1">
                  Location Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Ironclad Keep"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1">
                    Pin Type
                  </label>
                  <select
                    value={newLocType}
                    onChange={(e) => setNewLocType(e.target.value as any)}
                    className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <option value="realm">Realm / Territory</option>
                    <option value="city">City / Settlement</option>
                    <option value="dungeon">Dungeon / Ruin</option>
                    <option value="landmark">Landmark / Tower</option>
                    <option value="headquarters">Headquarters</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1">
                    Threat Level
                  </label>
                  <select
                    value={newLocDanger}
                    onChange={(e) => setNewLocDanger(e.target.value as any)}
                    className="w-full h-9 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <option value="Safe">Safe Zone</option>
                    <option value="Moderate">Moderate Danger</option>
                    <option value="Hazardous">Hazardous</option>
                    <option value="Lethal">Lethal / Uncharted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1">
                  Ruling Faction (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Arcane Order"
                  value={newLocFaction}
                  onChange={(e) => setNewLocFaction(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1">
                  Description / History
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this region's environment, significance, or secrets..."
                  value={newLocDesc}
                  onChange={(e) => setNewLocDesc(e.target.value)}
                  className="w-full p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl text-xs text-[var(--color-text-primary)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!newLocName.trim()}
                  className="text-xs h-9 font-semibold cursor-pointer"
                >
                  Save Map Pin
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
