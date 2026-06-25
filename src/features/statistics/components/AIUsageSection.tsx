import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { VerseFullStats, PIE_COLORS } from '../types'
import { Bot, MessageCircle, FileText } from 'lucide-react'

interface AIUsageSectionProps {
  aiUsage: VerseFullStats['aiUsage']
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-lg p-2.5 shadow-xl text-xs gap-1 flex flex-col font-medium">
        <span className="text-[var(--color-text-secondary)] font-semibold mb-0.5">
          {payload[0].payload.name || payload[0].name || label}
        </span>
        <span className="text-[var(--color-accent-primary)] text-sm font-bold">
          {payload[0].value?.toLocaleString()} prompts
        </span>
      </div>
    )
  }
  return null
}

export const AIUsageSection = ({ aiUsage }: AIUsageSectionProps) => {
  const chartData = aiUsage.byProvider.map((p) => ({
    name: p.provider.toUpperCase(),
    value: p.count,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Visual Pie Chart left/middle */}
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 lg:col-span-2 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            AI Provider Execution Share
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Model endpoint invocations recorded inside the workspace
          </span>
        </div>

        <div className="w-full h-[250px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center font-medium text-xs text-[var(--color-text-muted)] italic">
              No AI sessions recorded. Interact with the AI Workspace!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`ai-cell-${index}`}
                      fill={PIE_COLORS[(index + 4) % PIE_COLORS.length]}
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

      {/* Metrics List (Right column) */}
      <div className="flex flex-col gap-3 lg:col-span-1">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm flex-1 justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              AI Workspace Telemetry
            </h3>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Cumulative session parameters
            </span>
          </div>

          <div className="flex flex-col gap-3 py-1">
            {/* Total Threads */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-amber-400/10 text-amber-400 flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Total Conversations
                </span>
                <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                  {aiUsage.totalConversations} threads
                </span>
              </div>
            </div>

            {/* Total Messages */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-emerald-400/10 text-emerald-400 flex-shrink-0">
                <MessageCircle size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Total Messages Sent
                </span>
                <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                  {aiUsage.totalMessages.toLocaleString()} messages
                </span>
              </div>
            </div>

            {/* Active Guidelines */}
            <div className="flex items-center gap-3.5 bg-[var(--color-bg-subtle)]/40 p-3 rounded-lg border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-accent-primary)]/40 transition-colors">
              <div className="p-2 rounded-md bg-indigo-400/10 text-indigo-400 flex-shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Active Style Guidelines
                </span>
                <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                  {aiUsage.activeGuidelines} active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
