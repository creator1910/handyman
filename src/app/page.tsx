'use client'

import AppShell from '@/components/AppShell'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  const handleProspectSuggestion = (data: any) => {
    console.log('Prospect suggestion:', data)
  }

  return (
    <AppShell>
      <ChatInterface onProspectSuggestion={handleProspectSuggestion} />
    </AppShell>
  )
}