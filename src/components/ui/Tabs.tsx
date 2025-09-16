import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-150 whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon && (
                <span aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto" role="tabpanel">
        {activeTabContent}
      </div>
    </div>
  )
}