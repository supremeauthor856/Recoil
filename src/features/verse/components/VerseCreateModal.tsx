import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { ColorPicker } from './ColorPicker'
import * as verseService from '../../../services/verseService'
import * as characterService from '../../../services/characterService'
import { loreService } from '../../../services/loreService'
import * as writingService from '../../../services/writingService'
import { useUIStore } from '../../../store/uiStore'
import { parseChubJson, ExtractedChubData } from '../../import/utils/chubParser'
import { 
  Upload, 
  FileJson, 
  Check, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Compass, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Users, 
  Globe, 
  BookOpen, 
  Eye, 
  Wand2 
} from 'lucide-react'

interface VerseCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function VerseCreateModal({ isOpen, onClose, onSuccess }: VerseCreateModalProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [activeTab, setActiveTab] = useState<'details' | 'worldbuilding' | 'import'>('details')

  // Core Verse State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconColor, setIconColor] = useState('#6366F1')
  const [iconLetter, setIconLetter] = useState('')
  const [isManualLetter, setIsManualLetter] = useState(false)
  const [loading, setLoading] = useState(false)

  // 9 New Universe Creation Features
  const [genre, setGenre] = useState('High Fantasy')
  const [canonStrictness, setCanonStrictness] = useState('Strict Canon')
  const [magicSystem, setMagicSystem] = useState('Hard Magic')
  const [narrativeTone, setNarrativeTone] = useState('Heroic & Lighthearted')
  const [targetAudience, setTargetAudience] = useState('Teen 13+')
  const [eraTechLevel, setEraTechLevel] = useState('Medieval / Renaissance')
  const [seedStarterWorldbuilding, setSeedStarterWorldbuilding] = useState(true)
  const [primaryFactionName, setPrimaryFactionName] = useState('')
  const [visibilityPrivacy, setVisibilityPrivacy] = useState('Private Draft')

  // Import-specific states
  const [importedData, setImportedData] = useState<ExtractedChubData | null>(null)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [isImportError, setIsImportError] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setIconColor('#6366F1')
      setIconLetter('')
      setIsManualLetter(false)
      setGenre('High Fantasy')
      setCanonStrictness('Strict Canon')
      setMagicSystem('Hard Magic')
      setNarrativeTone('Heroic & Lighthearted')
      setTargetAudience('Teen 13+')
      setEraTechLevel('Medieval / Renaissance')
      setSeedStarterWorldbuilding(true)
      setPrimaryFactionName('')
      setVisibilityPrivacy('Private Draft')
      setImportedData(null)
      setImportFileName(null)
      setIsImportError(false)
      setActiveTab('details')
    }
  }, [isOpen])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isManualLetter) {
      setIconLetter(val.trim().charAt(0).toUpperCase())
    }
  }

  const handleLetterChange = (val: string) => {
    setIconLetter(val.slice(0, 2))
    setIsManualLetter(true)
  }

  const textToHtml = (text: string): string => {
    if (!text) return ''
    return text
      .split('\n')
      .map((para) => {
        const trimmed = para.trim()
        if (!trimmed) return '<p><br></p>'
        let escaped = trimmed
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        return `<p>${escaped}</p>`
      })
      .join('')
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseChubJson(text)
      if (parsed) {
        setImportedData(parsed)
        setImportFileName(file.name)
        setIsImportError(false)

        const mainChar = parsed.characters[0]
        const finalName = mainChar?.name
          ? mainChar.name.endsWith(' Universe')
            ? mainChar.name
            : `${mainChar.name} Universe`
          : parsed.verseName

        setName(finalName)
        if (!isManualLetter) {
          const charName = mainChar?.name || parsed.verseName
          setIconLetter(charName.trim().charAt(0).toUpperCase())
        }
        if (parsed.verseDescription) {
          setDescription(parsed.verseDescription)
        } else if (mainChar?.description) {
          setDescription(mainChar.description.slice(0, 200) + '...')
        }
        addToast({
          title: `Parsed card with ${parsed.characters.length} characters & ${parsed.loreEntries.length} lore entries!`,
          type: 'success',
        })
      } else {
        setIsImportError(true)
        setImportedData(null)
        setImportFileName(null)
        addToast({
          title: 'Invalid JSON format card.',
          type: 'error',
        })
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const finalLetter = iconLetter.trim() || name.trim().charAt(0).toUpperCase()
      const created = await verseService.createVerse({
        name: name.trim(),
        description: description.trim() || undefined,
        icon_color: iconColor,
        icon_letter: finalLetter,
        genre,
        canon_strictness: canonStrictness,
        magic_system: magicSystem,
        narrative_tone: narrativeTone,
        target_audience: targetAudience,
        era_tech_level: eraTechLevel,
        seed_starter_worldbuilding: seedStarterWorldbuilding,
        primary_faction_name: primaryFactionName,
        visibility_privacy: visibilityPrivacy,
      })

      // Import character cards logic
      if (importedData) {
        if (importedData.characters && importedData.characters.length > 0) {
          for (const char of importedData.characters) {
            const charId = await characterService.createCharacter({
              verse_id: created.id,
              name: char.name,
              is_oc: true,
            })
            await characterService.updateCharacter(charId, {
              description: char.description || '',
              backstory: char.backstory || '',
              personality_summary: char.personality_summary || '',
              species: char.species || '',
              age: char.age || '',
              gender: char.gender || '',
              role: char.role || '',
            })
          }
        }
      }

      addToast({
        title: `Universe "${created.name}" established with ${genre} parameters!`,
        type: 'success',
      })
      onClose()
      if (onSuccess) onSuccess()
      navigate(`/verse/${created.id}`)
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Failed to create universe',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const previewLetter = iconLetter.trim() || (name.trim().charAt(0).toUpperCase() || '?')

  const footer = (
    <div className="flex items-center justify-between w-full pt-2 border-t border-slate-200 dark:border-slate-800">
      <span className="text-[11px] text-slate-500 font-medium">
        Indexed DB • Full Universe Storage
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading} type="button" className="text-xs h-9 cursor-pointer">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          loading={loading}
          type="button"
          className="text-xs h-9 px-5 font-bold shadow-xs cursor-pointer"
        >
          Establish Verse
        </Button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish New Universe" size="lg" footer={footer}>
      <div className="flex flex-col gap-5 select-none">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Compass size={14} /> Basic Identity & Branding
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('worldbuilding')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'worldbuilding'
                ? 'border-indigo-600 text-indigo-600 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Wand2 size={14} /> 9 Worldbuilding Settings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload size={14} /> Auto-Fill (Chub/JSON)
          </button>
        </div>

        {/* TAB 1: BASIC IDENTITY */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Live Icon Preview & Name Header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black uppercase shadow-md shrink-0"
                style={{ backgroundColor: iconColor }}
              >
                {previewLetter}
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  label="Universe Name *"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Chronicles of Aethelgard"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <Textarea
              label="Summary & Elevator Pitch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the overarching premise, conflict, and lore theme of your world..."
              rows={3}
              disabled={loading}
            />

            {/* Visual Icon Customization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker value={iconColor} onChange={setIconColor} label="Brand Icon Color" />

              <Input
                label="Custom Badge Initial"
                value={iconLetter}
                onChange={(e) => handleLetterChange(e.target.value)}
                placeholder="e.g. A"
                maxLength={2}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* TAB 2: 9 WORLDBUILDING FEATURES */}
        {activeTab === 'worldbuilding' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            
            {/* Feature 1: Primary Genre */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Primary Genre / Setting</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="High Fantasy">High Fantasy / Sword & Sorcery</option>
                <option value="Cyberpunk">Cyberpunk / Dystopian Tech</option>
                <option value="Sci-Fi Space Opera">Sci-Fi Space Opera / Cosmic</option>
                <option value="Modern Urban Fantasy">Modern Urban Fantasy</option>
                <option value="Historical Drama">Historical Drama / Period</option>
                <option value="Post-Apocalyptic">Post-Apocalyptic / Survival</option>
                <option value="Romance & Slice of Life">Romance & Slice of Life</option>
                <option value="Cosmic Horror / Mystery">Cosmic Horror / Mystery</option>
              </select>
            </div>

            {/* Feature 2: Canon Strictness */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Canon Rules Model</label>
              <select
                value={canonStrictness}
                onChange={(e) => setCanonStrictness(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="Strict Canon">Strict Canon (Impenetrable Lore)</option>
                <option value="Flexible Headcanon">Flexible Headcanon Allowed</option>
                <option value="Multiverse AU">Multiverse AU / Branching Timelines</option>
                <option value="Fanon Open Source">Fanon / Open Source Community</option>
              </select>
            </div>

            {/* Feature 3: Magic / Power System */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Magic & Power Rules</label>
              <select
                value={magicSystem}
                onChange={(e) => setMagicSystem(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="Hard Magic">Hard Magic (Strict Rules & Costs)</option>
                <option value="Soft Mysticism">Soft Mysticism (Miraculous & Mysterious)</option>
                <option value="Cybernetics/Tech">Cyberware & Tech Augmentation</option>
                <option value="Divine Blessing">Divine Favor / Spirit Pact</option>
                <option value="Martial Spirit">Martial Arts / Ki Energy</option>
                <option value="Non-Magical">Non-Magical Realism</option>
              </select>
            </div>

            {/* Feature 4: Narrative Tone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">4. Primary Narrative Tone</label>
              <select
                value={narrativeTone}
                onChange={(e) => setNarrativeTone(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="Heroic & Lighthearted">Heroic & Optimistic</option>
                <option value="Grimdark & Gritty">Grimdark & Gritty</option>
                <option value="Political Intrigue">Political Intrigue & Suspense</option>
                <option value="Philosophical & Deep">Philosophical & Deep</option>
                <option value="Whimsical & Magical">Whimsical & Magical</option>
              </select>
            </div>

            {/* Feature 5: Target Audience */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">5. Target Audience Rating</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="All Ages">All Ages (Family Friendly)</option>
                <option value="Teen 13+">Teen 13+ (PG-13 Adventure)</option>
                <option value="Mature 18+">Mature 18+ (Intense Themes)</option>
                <option value="Dark Adult">Dark Psychological Adult</option>
              </select>
            </div>

            {/* Feature 6: Era & Tech Level */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">6. Technology Level / Era</label>
              <select
                value={eraTechLevel}
                onChange={(e) => setEraTechLevel(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="Ancient / Mythic">Ancient / Mythic Era</option>
                <option value="Medieval / Renaissance">Medieval / Renaissance</option>
                <option value="Industrial / Steampunk">Industrial Revolution / Steampunk</option>
                <option value="Modern Day">Modern Day Contemporary</option>
                <option value="Near Future Cyber">Near Future Cybernetic</option>
                <option value="Interstellar Sci-Fi">Interstellar Sci-Fi / Deep Space</option>
              </select>
            </div>

            {/* Feature 7: Founding Faction */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">7. Primary Faction Name</label>
              <input
                type="text"
                placeholder="e.g. Celestial Alliance"
                value={primaryFactionName}
                onChange={(e) => setPrimaryFactionName(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Feature 8: Privacy & Visibility */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">8. Visibility & Privacy Tier</label>
              <select
                value={visibilityPrivacy}
                onChange={(e) => setVisibilityPrivacy(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="Private Draft">Private Draft (Personal Local Vault)</option>
                <option value="Encrypted Lore">Encrypted Lore Bible</option>
                <option value="Published Multiverse">Published Multiverse Canvas</option>
                <option value="Collaborative Sandbox">Collaborative Sandbox</option>
              </select>
            </div>

            {/* Feature 9: Seed Starter Worldbuilding Checkbox */}
            <div className="col-span-full bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setSeedStarterWorldbuilding(!seedStarterWorldbuilding)}>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> 9. Seed Starter Worldbuilding Vault
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically generates initial lore articles for core world rules, timelines, and faction blueprints.
                </p>
              </div>
              <input
                type="checkbox"
                checked={seedStarterWorldbuilding}
                onChange={(e) => setSeedStarterWorldbuilding(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

          </div>
        )}

        {/* TAB 3: AUTO-FILL IMPORT */}
        {activeTab === 'import' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileJson size={16} className="text-indigo-500" /> Import Chub / Tavern Character Card
              </span>
              {importedData && (
                <button
                  type="button"
                  onClick={() => {
                    setImportedData(null)
                    setImportFileName(null)
                    setName('')
                    setDescription('')
                  }}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Clear Import
                </button>
              )}
            </div>

            {!importedData ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Upload className="text-indigo-500 mb-2" size={24} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Character Card (.json)</span>
                <span className="text-[10px] text-slate-500 mt-1 text-center">Auto-extracts character lore, species, greetings, and worldbook articles!</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </label>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Check size={14} /> Ready: {importFileName}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Extracted {importedData.characters?.length || 0} characters and {importedData.loreEntries?.length || 0} lorebook articles.
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
