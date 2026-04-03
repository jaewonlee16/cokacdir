import { useParams, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import DocsSidebar from '../components/docs/DocsSidebar'
import DocsContent from '../components/docs/DocsContent'
import { LangToggle } from '../components/LanguageContext'

const DEFAULT_SECTION = 'installation'

export default function DocsPage() {
  const { sectionId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!sectionId) {
    return <Navigate to={`/docs/${DEFAULT_SECTION}`} replace />
  }

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/95 backdrop-blur border-b border-zinc-800 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <a href="#/" className="text-lg font-bold gradient-text">
            cokacdir
          </a>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-72 bg-bg-dark border-r border-zinc-800 z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-5 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <a href="#/" className="text-lg font-bold gradient-text">
                  cokacdir
                </a>
                <p className="text-zinc-600 text-xs mt-1">Documentation</p>
              </div>
              <div className="hidden lg:block">
                <LangToggle />
              </div>
            </div>
          </div>
          {/* Sidebar nav */}
          <div className="flex-1 overflow-y-auto sidebar-scroll p-4">
            <DocsSidebar
              activeSectionId={sectionId}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-6 py-8 pt-20 lg:pt-8">
          <DocsContent sectionId={sectionId} />
        </div>
      </main>
    </div>
  )
}
