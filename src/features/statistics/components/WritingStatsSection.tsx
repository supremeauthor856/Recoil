import React from 'react'
import { useParams } from 'react-router-dom'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { VerseFullStats, PIE_COLORS } from '../types'
import { TopListCard, TopListItem } from './TopListCard'
import { statisticsService } from '../../../services/statisticsService'

interface WritingStatsSectionProps {
  writing: VerseFullStats['writing']
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isCount = payload[0].name === 'volume' || payload[0].name === 'count'
    const valueDisp = isCount
      ? payload[0].value?.toLocaleString()
      : `${payload[0].value?.toLocaleString()} words`

    return (
      <div className="bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-lg p-2.5 shadow-xl text-xs gap-1 flex flex-col font-medium">
        <span className="text-[var(--color-text-secondary)] font-semibold mb-0.5">
          {payload[0].payload.name || payload[0].name || label}
        </span>
        <span className="text-[var(--color-accent-primary)] text-sm font-bold">
          {valueDisp}
        </span>
      </div>
    )
  }
  return null
}

export const WritingStatsSection = ({ writing }: WritingStatsSectionProps) => {
  const { verseId } = useParams()

  // Chart 1: Writing Type word count distribution
  const typeChartData = writing.byType.map((t) => ({
    name: t.type.toUpperCase(),
    words: t.wordCount,
    pieces: t.count,
  }))

  // Chart 2: Status distribution (Pie Chart)
  const statusChartData = writing.byStatus.map((s) => ({
    name: s.status || 'Draft',
    value: s.count,
  }))

  const longestPiecesItems: TopListItem[] = writing.longestPieces.map((p) => ({
    id: p.id,
    title: p.title,
    subtext: p.type.toUpperCase(),
    metric: `${p.wordCount.toLocaleString()} words`,
    linkPath: `/verse/${verseId}/writing/${p.id}`,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Word Counts by Writing Type */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Word Count by Narrative Genre
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Accumulated words written across type categories
            </span>
          </div>

          <div className="w-full h-[280px]">
            {typeChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
                No writing pieces recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" opacity={0.15} horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-subtle)', opacity: 0.1 }} />
                  <Bar dataKey="words" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Story Status Distributions */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Production Stage Statistics
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Breakdown of writings by their editing status
            </span>
          </div>

          <div className="w-full h-[280px]">
            {statusChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
                No status data mapped
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {statusChartData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
                        stroke="var(--color-bg-elevated)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value) => <span className="text-[var(--color-text-secondary)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sub-series Grid / Longest Pieces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sub-Series List */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 lg:col-span-2 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Active Sub-Series Grouping
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Breakdown of counts and aggregate word lengths per sub-series
            </span>
          </div>

          {writing.bySubSeries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-text-muted)] italic py-10">
              No sub-series groupings created
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {writing.bySubSeries.map((s, idx) => (
                <div
                  key={`series-${idx}`}
                  className="bg-[var(--color-bg-subtle)]/30 border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-default)]/60 p-3.5 rounded-lg flex flex-col gap-1.5 transition-all duration-100"
                >
                  <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                    {s.subSeriesName}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-medium mt-1">
                    <span>{s.pieceCount} Piece{s.pieceCount === 1 ? '' : 's'}</span>
                    <span className="text-[var(--color-accent-primary)] font-bold">
                      {statisticsService.formatWordCount(s.wordCount)} words
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Longest Pieces ranked display */}
        <TopListCard title="Longest Narrative Manuscripts" items={longestPiecesItems} />
      </div>
    </div>
  )
}
