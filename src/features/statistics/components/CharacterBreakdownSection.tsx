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
import { VerseFullStats, PIE_COLORS, CHART_BAR_GRADIENT } from '../types'
import { TopListCard, TopListItem } from './TopListCard'

interface CharacterBreakdownSectionProps {
  characters: VerseFullStats['characters']
}

// Custom Recharts Tooltip matching system themes
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-lg p-2.5 shadow-xl text-xs gap-1 flex flex-col font-medium">
        <span className="text-[var(--color-text-secondary)] font-semibold mb-0.5">
          {payload[0].name || label}
        </span>
        <span className="text-[var(--color-accent-primary)] text-sm font-bold">
          {payload[0].value?.toLocaleString()}
        </span>
      </div>
    )
  }
  return null
}

export const CharacterBreakdownSection = ({ characters }: CharacterBreakdownSectionProps) => {
  const { verseId } = useParams()

  // Format Recharts Arc Stage data inside a Pie chart format
  const arcStageData = characters.byArcStage.map((s) => ({
    name: s.stage || 'Not Mapped',
    value: s.count,
  }))

  // Format Recharts Narrative Role data inside a Horizontal Bar chart format
  const barChartData = characters.byNarrativeRole.map((r) => ({
    name: r.role || 'Unspecified',
    count: r.count,
  }))

  // Populate Top list metrics mapping
  const mostCompleteItems: TopListItem[] = characters.mostComplete.map((c) => ({
    id: c.id,
    title: c.name,
    subtext: c.narrative_role || 'No narrative role',
    metric: `${c.completion}%`,
    linkPath: `/verse/${verseId}/characters/${c.id}`,
  }))

  const leastCompleteItems: TopListItem[] = characters.leastComplete.map((c) => ({
    id: c.id,
    title: c.name,
    subtext: c.narrative_role || 'No narrative role',
    metric: `${c.completion}%`,
    linkPath: `/verse/${verseId}/characters/${c.id}`,
  }))

  const mostConnectedItems: TopListItem[] = characters.mostConnected.map((c) => ({
    id: c.id,
    title: c.name,
    subtext: 'Character relationships',
    metric: `${c.connectionCount} conn`,
    linkPath: `/verse/${verseId}/characters/${c.id}`,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Arc Stages (Pie Chart) */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Arc Stage Distributions
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Characters mapped across narrative lifecycle stages
            </span>
          </div>

          <div className="w-full h-[280px]">
            {arcStageData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
                No arc stage data mapped
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={arcStageData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {arcStageData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
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

        {/* Narrative Roles (Horizontal Bar Chart) */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Narrative Role Breakdown
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Breakdown of protagonists, antagonists, and supporting cast
            </span>
          </div>

          <div className="w-full h-[280px]">
            {barChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
                No role data mapped
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" opacity={0.15} horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-subtle)', opacity: 0.1 }} />
                  <Bar dataKey="count" fill={CHART_BAR_GRADIENT} radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {barChartData.map((_entry, index) => (
                      <Cell key={`bar-${index}`} fill="var(--color-accent-primary)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Ranks Bento-Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TopListCard title="Most Finished Character Bios" items={mostCompleteItems} />
        <TopListCard title="Starting Draft Character Bios" items={leastCompleteItems} />
        <TopListCard title="Socially Connected Entities" items={mostConnectedItems} />
      </div>
    </div>
  )
}
