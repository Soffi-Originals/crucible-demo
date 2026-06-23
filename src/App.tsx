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
    title: 'Dashboard',
    description: 'Plan, prioritize, and accomplish your tasks with ease.',
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

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem('crucible-sidebar-collapsed') === 'true'
  } catch {
    return false
  }
}

function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed)
  const { theme, toggle } = useTheme()

  const handleNavigate = (id: PageId) => {
    setPage(id)
    setSidebarOpen(false)
  }

  const handleCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    try {
      localStorage.setItem('crucible-sidebar-collapsed', String(collapsed))
    } catch {
      // ignore
    }
  }

  return (
    <AppShell
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      sidebarCollapsed={sidebarCollapsed}
      sidebar={
        <Sidebar
          current={page}
          onNavigate={handleNavigate}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleCollapsedChange}
        />
      }
      header={
        <Header
          workspace="Crucible"
          page={pageMeta[page].title}
          description={pageMeta[page].description}
          badge={pageMeta[page].badge}
          theme={theme}
          onToggleTheme={toggle}
          onMenuClick={() => setSidebarOpen(true)}
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
