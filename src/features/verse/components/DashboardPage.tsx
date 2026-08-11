import { useState, useEffect } from 'react'
import { Plus, Compass, Upload, Calendar, Star, CheckCircle2, MoreHorizontal, User, BookOpen, ArrowRight, Layers, Sparkles } from 'lucide-react'
import { useVerses } from '../hooks/useVerses'
import { VerseCard } from './VerseCard'
import { VerseCreateModal } from './VerseCreateModal'
import { VerseStats } from '../types'
import { Button } from '../../../shared/components/ui/Button'
import * as verseService from '../../../services/verseService'
import { db } from '../../../services/db'
import type { Character } from '../../../shared/types/database'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export function DashboardPage() {
  const { verses, loading, refetch } = useVerses()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [statsMap, setStatsMap] = useState<Record<string, VerseStats>>({})
  const [characters, setCharacters] = useState<Character[]>([])
  const [recentLore, setRecentLore] = useState<any[]>([])
  const navigate = useNavigate()

  // Fetch stats and characters
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const chars = await db.characters.toArray()
        setCharacters(chars)

        const allPieces = await db.writing_pieces.toArray()
        const lore = allPieces.filter(p => p.type === 'lore-article')
        setRecentLore(lore)
      } catch (e) {
        console.error('Failed loading dashboard data', e)
      }
    }
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (verses.length === 0) return

    const fetchAllStats = async () => {
      try {
        const statsPromises = verses.map((verse) =>
          verseService
            .getVerseStats(verse.id)
            .then((stats) => ({ id: verse.id, stats }))
            .catch(() => ({
              id: verse.id,
              stats: {
                characterCount: 0,
                loreCount: 0,
                writingCount: 0,
                subSeriesCount: 0,
                conversationCount: 0,
                totalWordCount: 0,
              },
            }))
        )

        const results = await Promise.all(statsPromises)
        const updatedStatsMap: Record<string, VerseStats> = {}
        for (const res of results) {
          updatedStatsMap[res.id] = res.stats
        }
        setStatsMap(updatedStatsMap)
      } catch (err) {
        console.error('Failed to pre-fetch verse card stats:', err)
      }
    }

    fetchAllStats()
  }, [verses])

  // Pie Chart Data
  const chartData = [
    { name: 'Executed Arcs', value: 5, color: '#3B82F6' },
    { name: 'Active Arcs', value: 7, color: '#F87171' },
    { name: 'Draft Stage', value: 3, color: '#F59E0B' },
  ]

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 select-none">
      
      {/* 1. Page Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Universe Story Journeys
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual character arcs, lore connections, and worldbuilding workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={16} />}
            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 rounded-full px-5 py-2 font-semibold shadow-md"
          >
            New Verse
          </Button>
        </div>
      </div>

      {/* 2. Main Modular Journey Canvas Board Card (Matches Reference Image Large Card) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
        
        {/* Card Header inside Board */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              New Character & Arc Management
            </h2>
            <p className="text-xs text-slate-500">
              Interactive node pipeline for active universe story progression
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar Team Pile */}
            <div className="flex items-center -space-x-2">
              {characters.slice(0, 6).map((c, i) => (
                <div key={c.id || i} className="relative group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-600 p-0.5 shadow-xs ring-2 ring-white dark:ring-slate-900">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-800 dark:text-slate-200">
                      {c.name ? c.name.charAt(0) : 'C'}
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                    {i + 1}
                  </span>
                </div>
              ))}
              <button 
                onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/characters` : '/')}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:scale-105 transition-transform"
              >
                +
              </button>
            </div>

            {/* Floating Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreateOpen(true)}
                title="Create New Verse"
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hover:scale-105"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/import` : '/settings')}
                title="Import / Export Data"
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hover:scale-105"
              >
                <Upload size={16} />
              </button>
              <button 
                onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/tools/arc-board` : '/')}
                title="Story Arc Board"
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hover:scale-105"
              >
                <Calendar size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modular Connected Pipeline Grid (4 Flow Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          
          {/* Column 1: Arc Allocation */}
          <div className="space-y-4">
            <div className="bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold">
                    A1
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 text-slate-400 hover:text-slate-600"><CheckCircle2 size={16} /></button>
                  <button className="p-1 text-slate-400 hover:text-slate-600"><Calendar size={16} /></button>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Allocate Arc to Protagonist!</p>
            </div>

            <div className="bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold">
                    A2
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 text-slate-400 hover:text-slate-600"><CheckCircle2 size={16} /></button>
                  <button className="p-1 text-slate-400 hover:text-slate-600"><Calendar size={16} /></button>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Acknowledge Arc catalyst event!</p>
            </div>
          </div>

          {/* Column 2: Issue Identification */}
          <div className="bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            {[
              { label: 'Identify Arc Category', check: true },
              { label: 'Identify Lore Severity', check: true },
              { label: 'Identify Narrative Impact', check: true },
              { label: 'Allocate to Resolution Team', active: true },
              { label: 'Advise Character Goal', active: false },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${step.active ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                    {step.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  {step.check ? <CheckCircle2 size={14} className="text-emerald-500" /> : <MoreHorizontal size={14} />}
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: Technical Resolution */}
          <div className="bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            {[
              { label: 'Identify Arc Dependencies', icon: Plus },
              { label: 'Identify Climax Resolution', icon: Plus },
              { label: 'Estimate Resolution Time', bold: true },
              { label: 'Advise Character of Growth' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                    +
                  </div>
                  <span className={`text-xs ${step.bold ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {step.label}
                  </span>
                </div>
                <MoreHorizontal size={14} className="text-slate-400" />
              </div>
            ))}
          </div>

          {/* Column 4: New Tasks Matrix */}
          <div className="space-y-3">
            {/* Active Highlight Capsule */}
            <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-4 rounded-2xl shadow-md space-y-1 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Stage Active</span>
              <p className="text-sm font-extrabold tracking-tight">Request Processing</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Problem Resolution', 'Character Growth', 'Testing Verification', 'Final Satisfaction'].map((box) => (
                <div key={box} className="bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-center">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{box}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Label Bar */}
        <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {['Arc Allocation', 'Issue Identification', 'Technical Resolution', 'New Goals'].map((label, i) => (
            <div key={label} className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              {i + 1}. {label}
            </div>
          ))}
        </div>

      </div>

      {/* 3. Bottom Two Dashboard Widgets (Suggested Knowledge Table + Journey Metrics Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Widget: Suggested Knowledge / World Database Table (7 cols) */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Suggested Knowledge & Lore
                </h3>
                <p className="text-xs text-slate-500">Worldbuilding articles & timeline entries</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/lore` : '/')}
                  title="Create Lore Entry"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Plus size={14} />
                </button>
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/import` : '/settings')}
                  title="Import Data"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Upload size={14} />
                </button>
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/tools/foreshadowing` : '/')}
                  title="Foreshadowing Planner"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Calendar size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-2">Fav</th>
                    <th className="py-2.5 px-2">Subject</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Character</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {recentLore.slice(0, 4).map((lore, idx) => (
                    <tr key={lore.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-2">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                      </td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100">{lore.title || 'Design Sprint'}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          idx % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {idx % 2 === 0 ? 'Executed' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">2026-07-21</td>
                      <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">Sam Frank</td>
                    </tr>
                  ))}
                  {recentLore.length === 0 && (
                    <>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-2"><Star size={13} className="text-amber-400 fill-amber-400" /></td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100">Design Sprint Lore</td>
                        <td className="py-2.5 px-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Executed</span></td>
                        <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">2026-07-21</td>
                        <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">Sam Frank</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-2"><Star size={13} className="text-amber-400 fill-amber-400" /></td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100">Meeting Lead Notes</td>
                        <td className="py-2.5 px-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Scheduled</span></td>
                        <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">2026-07-22</td>
                        <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">Nikki Olay</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Widget: Support Ticket Journey / Analytics Gauge Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Story Ticket Journey
                </h3>
                <p className="text-xs text-slate-500">Active vs Executed Arc Progress</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/tools/headcanon-vault` : '/')}
                  title="Headcanon Vault"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Plus size={14} />
                </button>
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/import` : '/settings')}
                  title="Import Data"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Upload size={14} />
                </button>
                <button 
                  onClick={() => navigate(verses[0] ? `/verse/${verses[0].id}/tools/arc-board` : '/')}
                  title="Story Arc Board"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
                >
                  <Calendar size={14} />
                </button>
              </div>
            </div>

            {/* Gauge Ring Chart Visual */}
            <div className="h-[180px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute bottom-2 flex justify-center gap-8 text-center">
                <div>
                  <span className="text-xl font-extrabold text-blue-600">5</span>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Executed</p>
                </div>
                <div>
                  <span className="text-xl font-extrabold text-rose-500">7</span>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Verses List Grid Cards Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Active Verses
            </h2>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {verses.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {verses.map((verse) => (
            <VerseCard
              key={verse.id}
              verse={verse}
              stats={statsMap[verse.id]}
              onVerseChanged={refetch}
            />
          ))}
        </div>
      </div>

      {/* Verse Creation Modal */}
      <VerseCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
