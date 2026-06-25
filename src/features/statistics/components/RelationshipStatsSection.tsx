import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'
import { VerseFullStats } from '../types'
import { Users, Share2, Award } from 'lucide-react'

interface RelationshipStatsSectionProps {
  relationships: VerseFullStats['relationships']
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-lg p-2.5 shadow-xl text-xs gap-1 flex flex-col font-medium">
        <span className="text-[var(--color-text-secondary)] font-semibold mb-0.5">
          {label}
        </span>
        <span className="text-[var(--color-accent-primary)] text-sm font-bold">
          {payload[0].value?.toLocaleString()} bond{payload[0].value === 1 ? '' : 's'}
        </span>
      </div>
    )
  }
  return null
}

export const RelationshipStatsSection = ({ relationships }: RelationshipStatsSectionProps) => {
  const chartData = relationships.byType.map((t) => ({
    name: t.type.toUpperCase(),
    bonds: t.count,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Network Configuration Cards (Left side) */}
      <div className="flex flex-col gap-3 lg:col-span-1">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm flex-1 justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Lore Network Density
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              General connectivity coefficients
            </span>
          </div>

          <div className="flex flex-col gap-3 py-1">
            {/* Average Connections */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-amber-400/10 text-amber-400 flex-shrink-0">
                <Share2 size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Average Character Bonds
                </span>
                <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                  {relationships.averageConnectionsPerCharacter} connections
                </span>
              </div>
            </div>

            {/* Total Connections mapped */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-emerald-400/10 text-emerald-400 flex-shrink-0">
                <Users size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Total Active Bondings
                </span>
                <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                  {relationships.byType.reduce((s, t) => s + t.count, 0)} mapped
                </span>
              </div>
            </div>

            {/* System recommendation insight */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-indigo-400/10 text-indigo-400 flex-shrink-0">
                <Award size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Social Cohesion State
                </span>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  {relationships.averageConnectionsPerCharacter >= 2.5
                    ? 'Dense interconnected weave'
                    : relationships.averageConnectionsPerCharacter > 0
                    ? 'Developing storyline bonds'
                    : 'Unconnected isolated souls'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart (Right side) */}
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 lg:col-span-2 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Distribution of Relationship Styles
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Story dynamics grouped across romantic, platonic, and rivalry categories
          </span>
        </div>

        <div className="w-full h-[250px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
              No character relationships mapped yet. Create some in the Chemistry Matrix!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" opacity={0.15} horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-subtle)', opacity: 0.1 }} />
                <Bar dataKey="bonds" fill="var(--color-accent-primary)" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`bond-bar-${index}`} fill="var(--color-accent-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
