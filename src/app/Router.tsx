import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { EmptyState } from '../shared/components/ui/EmptyState'
import { LayoutDashboard, Compass } from 'lucide-react'
import { Button } from '../shared/components/ui/Button'

// Dashboard Page Component
const DashboardPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center">
      <div className="text-center mb-12 mt-8">
        <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] tracking-tight">Recoil</h1>
        <p className="text-[var(--color-text-secondary)] mt-2">Your verse. Your characters. Your story.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Left Column */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-16 h-16 bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] rounded-full flex items-center justify-center mb-6">
            <Compass size={32} />
          </div>
          <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Create your first verse</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            A verse is a universe, setting, or world where your characters and stories live.
          </p>
          <Button variant="primary" size="md">
            Create Verse
          </Button>
        </div>

        {/* Right Column */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] flex flex-col h-full min-h-[300px]">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <EmptyState 
              icon={<LayoutDashboard size={32} />} 
              title="No recent activity" 
              description="Your recent edits, new characters, and writing progress will appear here."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder Page
const PlaceholderPage = ({ title, description }: { title: string, description: string }) => (
  <div className="p-8 pb-32">
    <EmptyState 
      icon={<LayoutDashboard size={48} />} 
      title={title} 
      description={description}
    />
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'verse/:verseId', element: <PlaceholderPage title="Verse Overview" description="Feature coming soon." /> },
      { path: 'verse/:verseId/characters', element: <PlaceholderPage title="Characters" description="Feature coming soon." /> },
      { path: 'verse/:verseId/characters/:characterId', element: <PlaceholderPage title="Character Profile" description="Feature coming soon." /> },
      { path: 'verse/:verseId/lore', element: <PlaceholderPage title="Lore" description="Feature coming soon." /> },
      { path: 'verse/:verseId/lore/:entryId', element: <PlaceholderPage title="Lore Entry" description="Feature coming soon." /> },
      { path: 'verse/:verseId/writing', element: <PlaceholderPage title="Writing" description="Feature coming soon." /> },
      { path: 'verse/:verseId/writing/:pieceId', element: <PlaceholderPage title="Writing Editor" description="Feature coming soon." /> },
      { path: 'verse/:verseId/relationships', element: <PlaceholderPage title="Relationship Web" description="Feature coming soon." /> },
      { path: 'verse/:verseId/verse-map', element: <PlaceholderPage title="Verse Map" description="Feature coming soon." /> },
      { path: 'verse/:verseId/ai', element: <PlaceholderPage title="AI Workspace" description="Feature coming soon." /> },
      { path: 'verse/:verseId/tools/:toolName', element: <PlaceholderPage title="Tool" description="Feature coming soon." /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" description="Settings feature coming soon." /> },
      { path: 'settings/:section', element: <PlaceholderPage title="Settings Section" description="Settings feature coming soon." /> },
      { path: '*', element: <PlaceholderPage title="404 Not Found" description="The page you are looking for does not exist." /> },
    ]
  }
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
