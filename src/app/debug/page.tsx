'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testMCP = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-prod')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to fetch', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testChat = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Liste alle Kunden auf' }]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += new TextDecoder().decode(value)
        }
      }

      setResult({ chatResponse: fullResponse, success: true })
    } catch (error) {
      setResult({ error: 'Chat failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const createTestCustomer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCustomer',
          firstName: 'Production',
          lastName: 'Test',
          email: 'prod-test@example.com'
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to create customer', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Production Debug</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={testMCP}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test MCP Client'}
        </button>

        <button
          onClick={testChat}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Chat API'}
        </button>

        <button
          onClick={createTestCustomer}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Creating...' : 'Create Test Customer'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}