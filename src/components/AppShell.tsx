'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
}

const navigation = [
  { name: 'Chat', href: '/', icon: '💬', aria: 'Chat mit AI Assistent' },
  { name: 'CRM', href: '/kunden', icon: '👥', aria: 'Kunden und Interessenten verwalten' },
  { name: 'Angebote', href: '/angebote', icon: '📋', aria: 'Angebote erstellen und verwalten' },
  { name: 'Rechnungen', href: '/rechnungen', icon: '📄', aria: 'Rechnungen verwalten' },
  { name: 'Einstellungen', href: '/einstellungen', icon: '⚙️', aria: 'App-Einstellungen' }
]

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto border-r border-border bg-surface/30">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">HandyAI</h1>
              <p className="text-sm text-muted">Handwerker Assistent</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-2" role="navigation" aria-label="Hauptnavigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={item.aria}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-150 ease-out',
                    isActive
                      ? 'bg-primary text-white shadow-soft'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-soft'
                  )}
                >
                  <span className="mr-3 text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Footer */}
          <div className="flex-shrink-0 px-6 pb-2">
            <div className="text-xs text-muted">
              Version 1.0 MVP
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-surface/95 backdrop-blur-sm transform transition-transform duration-200 ease-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full pt-6 pb-4 overflow-y-auto border-r border-border">
          {/* Mobile Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">HandyAI</h1>
              <p className="text-sm text-muted">Handwerker Assistent</p>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-150 ease-out',
                    isActive
                      ? 'bg-primary text-white shadow-soft'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-soft'
                  )}
                >
                  <span className="mr-3 text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => setSidebarOpen(true)}
              aria-label="Navigation öffnen"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">HandyAI</h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <nav className="flex" role="navigation" aria-label="Mobile Navigation">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.aria}
                className={cn(
                  'flex-1 flex flex-col items-center px-2 py-3 text-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <span className="text-lg mb-1" aria-hidden="true">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}