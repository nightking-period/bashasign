import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { ToastContainer } from '@/components/ui'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  const { settings, isSidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore()
  const { fontSize, highContrast, reducedMotion } = settings

  // Close sidebar on tablet/mobile resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  const sidebarWidth = isSidebarOpen ? 240 : 64

  return (
    <div
      className={cn(
        'min-h-screen bg-surface',
        fontSize === 'large' && 'font-large',
        fontSize === 'xl' && 'font-xl',
        highContrast && 'high-contrast',
        reducedMotion && 'reduce-motion',
      )}
    >
      {/* Skip-to-content accessibility link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Fixed navbar */}
      <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Tablet/mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 top-[60px] z-20 bg-black/30 lg:hidden"
        />
      )}

      {/* Left sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Main content"
        className={cn(
          'min-h-screen transition-[margin-left] duration-200 ease-in-out',
          'pt-[60px] pb-16 md:pb-0',
        )}
        style={{ '--sidebar-offset': `${sidebarWidth}px` } as React.CSSProperties}
      >
        {/* Responsive margin: on ≥lg push by sidebar width; on <lg no margin (sidebar overlays) */}
        <style>{`
          @media (min-width: 1024px) {
            #main-content { margin-left: ${sidebarWidth}px; }
          }
        `}</style>

        <div className="p-4 md:p-6 max-w-screen-2xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom mobile nav (hidden on md+) */}
      <MobileNav />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
