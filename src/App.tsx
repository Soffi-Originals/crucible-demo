import { useState } from 'react'
import { AppShell } from '@/components/views/AppShell'
import { Sidebar, type PageId } from '@/components/views/Sidebar'
import { Header } from '@/components/views/Header'
import { useTheme } from '@/lib/theme'

import { OverviewPage } from '@/pages/OverviewPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { SimulationsPage } from '@/pages/SimulationsPage'
import { EvalsPage } from '@/pages/EvalsPage'
import { ConnectorsPage } from '@/pages/ConnectorsPage'
import { PlansPage } from '@/pages/PlansPage'

const pageMeta: Record<
  PageId,
  { title: string; description?: string; badge?: string }
> = {
  overview: {
    title: 'Overview',
    description: 'Real-time agent health',
  },
  agents: { title: 'Agents', description: '4 agents' },
  simulations: {
    title: 'Simulations',
    description: 'Replay & branch interactions',
    badge: '2 running',
  },
  evals: { title: 'Eval packs' },
  connectors: { title: 'Connectors' },
  plans: { title: 'Plans & billing' },
}

function App() {
  const [page, setPage] = useState<PageId>('overview')
  const { theme, toggle } = useTheme()

  return (
    <AppShell
      sidebar={<Sidebar current={page} onNavigate={setPage} />}
      header={
        <Header
          workspace="Crucible"
          page={pageMeta[page].title}
          description={pageMeta[page].description}
          badge={pageMeta[page].badge}
          theme={theme}
          onToggleTheme={toggle}
          primaryAction={
            page === 'agents'
              ? { label: 'New agent' }
              : page === 'simulations'
                ? { label: 'New simulation' }
                : page === 'evals'
                  ? { label: 'New eval' }
                  : undefined
          }
        />
      }
    >
      {page === 'overview' && <OverviewPage />}
      {page === 'agents' && <AgentsPage />}
      {page === 'simulations' && <SimulationsPage />}
      {page === 'evals' && <EvalsPage />}
      {page === 'connectors' && <ConnectorsPage />}
      {page === 'plans' && <PlansPage />}
    </AppShell>
  )
}

export default App
