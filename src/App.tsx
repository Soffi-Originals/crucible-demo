import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/views/AppShell'
import { Sidebar, type PageId } from '@/components/views/Sidebar'
import { Header } from '@/components/views/Header'
import { useTheme } from '@/lib/theme'
import { useState } from 'react'

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
  overview: { title: 'Overview', description: 'Real-time agent health' },
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

const pathToPage: Record<string, PageId> = {
  '/': 'overview',
  '/overview': 'overview',
  '/agents': 'agents',
  '/simulations': 'simulations',
  '/evals': 'evals',
  '/connectors': 'connectors',
  '/plans': 'plans',
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const currentPage: PageId = pathToPage[location.pathname] ?? 'overview'
  const meta = pageMeta[currentPage]

  return (
    <AppShell
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      sidebar={
        <Sidebar
          current={currentPage}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={
        <Header
          workspace="Crucible"
          page={meta.title}
          description={meta.description}
          badge={meta.badge}
          theme={theme}
          onToggleTheme={toggle}
          onMenuClick={() => setSidebarOpen(true)}
          primaryAction={
            currentPage === 'agents'
              ? { label: 'New agent' }
              : currentPage === 'simulations'
                ? { label: 'New simulation' }
                : currentPage === 'evals'
                  ? { label: 'New eval' }
                  : undefined
          }
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/simulations" element={<SimulationsPage />} />
        <Route path="/evals" element={<EvalsPage />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

export default App
