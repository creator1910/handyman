'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function NavigationIcon({ name }: { name: string }) {
  switch (name) {
    case 'chat':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    case 'users':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    case 'settings':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return null
  }
}

interface AppShellProps {
  children: ReactNode
}

const navigation = [
  { name: 'Chat', href: '/', icon: 'chat', aria: 'Chat mit AI Assistent' },
  { name: 'Kunden', href: '/kunden', icon: 'users', aria: 'Kunden und Interessenten verwalten' },
  { name: 'Einstellungen', href: '/einstellungen', icon: 'settings', aria: 'App-Einstellungen' }
]

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">craft.ai</h1>
              <p className="text-sm text-gray-600">Handwerker Assistent</p>
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
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                  )}
                >
                  <span className="mr-3" aria-hidden="true">
                    <NavigationIcon name={item.icon} />
                  </span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Footer */}
          <div className="flex-shrink-0 px-6 pb-2">
            <div className="text-xs text-gray-500">
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm transform transition-transform duration-200 ease-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full pt-6 pb-4 overflow-y-auto border-r border-gray-200">
          {/* Mobile Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">craft.ai</h1>
              <p className="text-sm text-gray-600">Handwerker Assistent</p>
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
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                  )}
                >
                  <span className="mr-3" aria-hidden="true">
                    <NavigationIcon name={item.icon} />
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              onClick={() => setSidebarOpen(true)}
              aria-label="Navigation öffnen"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">craft.ai</h1>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <nav className="flex" role="navigation" aria-label="Mobile Navigation">
          {navigation.map((item) => {
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
                    ? 'text-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <span className="mb-1" aria-hidden="true">
                  <NavigationIcon name={item.icon} />
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