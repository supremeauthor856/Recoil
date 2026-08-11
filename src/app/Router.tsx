import { createBrowserRouter, RouterProvider, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { ScrollToTop } from '../shared/components/layout/ScrollToTop'
import { EmptyState } from '../shared/components/ui/EmptyState'
import { LayoutDashboard } from 'lucide-react'
import { DashboardPage } from '../features/verse/components/DashboardPage'
import { VerseOverviewPage } from '../features/verse/components/VerseOverviewPage'
import { SubSeriesOverviewPage } from '../features/verse/components/SubSeriesOverviewPage'
import { CharacterDetailPage } from '../features/characters/components/CharacterDetailPage'
import { CharacterListPage } from '../features/characters/components/CharacterListPage'
import { RelationshipWebPage } from '../features/relationships'
import { WritingListPage, WritingDetailPage } from '../features/writing'
import { SettingsPage } from '../features/settings'
import { LoreListPage, LoreEntryPage } from '../features/lore'
import AIWorkspacePage from '../features/ai-chat'
import { ImportPage } from '../features/import'
import { LoreExpanderPage } from '../features/tools/components/LoreExpanderPage'
import { VerseMapPage } from '../features/verse/components/VerseMapPage'
import { ForeshadowingPlannerPage } from '../features/tools/components/ForeshadowingPlannerPage'
import { ArcStatusBoardPage } from '../features/tools/components/ArcStatusBoardPage'
import { HeadcanonVaultPage } from '../features/tools/components/HeadcanonVaultPage'
import { ChapterSummaryPage } from '../features/tools/components/ChapterSummaryPage'
import { PlotHoleDetectorPage } from '../features/tools/components/PlotHoleDetectorPage'
import { DialogueVoiceTrainerPage } from '../features/tools/components/DialogueVoiceTrainerPage'
import { CharacterChemistryPage } from '../features/tools/components/CharacterChemistryPage'
import { VersionHistoryPage } from '../features/tools/components/VersionHistoryPage'
import { StatsDashboardPage } from '../features/statistics'

// Placeholder Page
const PlaceholderPage = ({ title: propTitle, description: propDescription }: { title?: string, description?: string }) => {
  const { toolName } = useParams<{ toolName?: string }>()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')

  let title = propTitle || 'Feature'
  let description = propDescription || 'Feature coming soon.'

  if (toolName) {
    const formatted = toolName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    title = formatted
    description = `The ${formatted} tool will allow you to analyze and enhance your worldbuilding and character arcs using the companion AI. We are currently developing this feature.`
  } else if (category) {
    const formatted = category.charAt(0).toUpperCase() + category.slice(1)
    title = formatted
    description = `Deep dive into the "${formatted}" directory of your worldbuilding database. Map out timelines, design a custom glossary, or track factions. Feature coming soon.`
  }

  return (
    <div className="p-8 pb-32 flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-6 rounded-2xl shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard size={24} />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 capitalize">{title}</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">{description}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <ScrollToTop />
        <AppShell />
      </>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'verse/:verseId', element: <VerseOverviewPage /> },
      { path: 'verse/:verseId/sub-series/:subSeriesId', element: <SubSeriesOverviewPage /> },
      { path: 'verse/:verseId/characters', element: <CharacterListPage /> },
      { path: 'verse/:verseId/characters/:characterId', element: <CharacterDetailPage /> },
      { path: 'verse/:verseId/lore', element: <LoreListPage /> },
      { path: 'verse/:verseId/lore/:id', element: <LoreEntryPage /> },
      { path: 'verse/:verseId/writing', element: <WritingListPage /> },
      { path: 'verse/:verseId/writing/:pieceId', element: <WritingDetailPage /> },
      { path: 'verse/:verseId/relationships', element: <RelationshipWebPage /> },
      { path: 'verse/:verseId/stats', element: <StatsDashboardPage /> },
      { path: 'verse/:verseId/verse-map', element: <VerseMapPage /> },
      { path: 'verse/:verseId/ai', element: <AIWorkspacePage /> },
      { path: 'verse/:verseId/import', element: <ImportPage /> },
      { path: 'verse/:verseId/tools/lore-expander', element: <LoreExpanderPage /> },
      { path: 'verse/:verseId/tools/foreshadowing', element: <ForeshadowingPlannerPage /> },
      { path: 'verse/:verseId/tools/arc-board', element: <ArcStatusBoardPage /> },
      { path: 'verse/:verseId/tools/headcanon-vault', element: <HeadcanonVaultPage /> },
      { path: 'verse/:verseId/tools/chapter-summary', element: <ChapterSummaryPage /> },
      { path: 'verse/:verseId/tools/plot-hole-detector', element: <PlotHoleDetectorPage /> },
      { path: 'verse/:verseId/tools/voice-trainer', element: <DialogueVoiceTrainerPage /> },
      { path: 'verse/:verseId/tools/chemistry-matrix', element: <CharacterChemistryPage /> },
      { path: 'verse/:verseId/tools/version-history', element: <VersionHistoryPage /> },
      { path: 'verse/:verseId/tools/:toolName', element: <PlaceholderPage title="Tool" description="Feature coming soon." /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/:section', element: <SettingsPage /> },
      { path: '*', element: <PlaceholderPage title="404 Not Found" description="The page you are looking for does not exist." /> },
    ]
  }
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
