'use client'

import { useState, type ReactNode } from 'react'

type Tab = {
  id: string
  label: string
}

type TabsProps = {
  tabs: Tab[]
  defaultTabId?: string
  children: (activeTabId: string) => ReactNode
}

export default function Tabs({ tabs, defaultTabId, children }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id)

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-surface-border">
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabId(tab.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-brand text-brand-light'
                  : 'border-transparent text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="pt-6">{children(activeTabId)}</div>
    </div>
  )
}
