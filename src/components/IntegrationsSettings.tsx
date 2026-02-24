'use client'

import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import PlaidLink from './plaid/PlaidLink'

interface Props {
  tenantId: Id<'tenants'>
}

export default function IntegrationsSettings({ tenantId }: Props) {
  const [puzzleKey, setPuzzleKey] = useState('')
  const [savingPuzzle, setSavingPuzzle] = useState(false)
  const [testingPuzzle, setTestingPuzzle] = useState(false)
  const [puzzleStatus, setPuzzleStatus] = useState<string | null>(null)

  const qbIntegration = useQuery(api.quickbooks.getIntegration, { tenantId })
  const puzzleIntegration = useQuery(api.puzzle.getIntegration, { tenantId })
  const savePuzzleKey = useMutation(api.puzzle.saveApiKey)
  const testPuzzle = useAction(api.puzzle.testConnection)

  const handleSavePuzzleKey = async () => {
    if (!puzzleKey.trim()) return
    setSavingPuzzle(true)
    setPuzzleStatus(null)
    try {
      await savePuzzleKey({ tenantId, apiKey: puzzleKey.trim() })
      setPuzzleKey('')
      setPuzzleStatus('API key saved successfully.')
    } catch (err: any) {
      setPuzzleStatus(`Error: ${err.message}`)
    } finally {
      setSavingPuzzle(false)
    }
  }

  const handleTestPuzzle = async () => {
    setTestingPuzzle(true)
    setPuzzleStatus(null)
    try {
      const result = await testPuzzle({ tenantId })
      setPuzzleStatus(result.message)
    } catch (err: any) {
      setPuzzleStatus(`Error: ${err.message}`)
    } finally {
      setTestingPuzzle(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect your bank and accounting tools to automate commission reconciliation.
        </p>
      </div>

      {/* ── Plaid ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Plaid — Bank Connection</h3>
            <p className="text-xs text-gray-500">Pull commission payments directly from your bank</p>
          </div>
        </div>
        <PlaidLink tenantId={tenantId} />
      </div>

      {/* ── QuickBooks ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">QB</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">QuickBooks Online</h3>
            <p className="text-xs text-gray-500">Auto-post journal entries for reconciled commissions</p>
          </div>
        </div>

        {qbIntegration?.active ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Connected — Company ID: {qbIntegration.realmId}
              </span>
            </div>
            <a
              href={`/api/quickbooks/connect?tenantId=${tenantId}`}
              className="text-sm text-green-700 hover:underline"
            >
              Reconnect
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Connect your QuickBooks Online account to automatically post journal entries
              for each reconciled commission payment.
            </p>
            <a
              href={`/api/quickbooks/connect?tenantId=${tenantId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect QuickBooks
            </a>
            <p className="text-xs text-gray-400">
              Sandbox mode: use the Intuit sandbox company for testing.
            </p>
          </div>
        )}
      </div>

      {/* ── Puzzle ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Pz</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Puzzle</h3>
            <p className="text-xs text-gray-500">Push commission transactions to Puzzle accounting</p>
          </div>
        </div>

        {puzzleIntegration?.active && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-purple-800">
              Connected — API key saved
            </span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {puzzleIntegration?.active ? 'Update' : 'Enter'} Puzzle API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={puzzleKey}
              onChange={(e) => setPuzzleKey(e.target.value)}
              placeholder="pzl_live_xxxxxxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
            <button
              onClick={handleSavePuzzleKey}
              disabled={savingPuzzle || !puzzleKey.trim()}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {savingPuzzle ? 'Saving...' : 'Save'}
            </button>
          </div>

          {puzzleIntegration?.active && (
            <button
              onClick={handleTestPuzzle}
              disabled={testingPuzzle}
              className="text-sm text-purple-600 hover:text-purple-800 underline disabled:opacity-50"
            >
              {testingPuzzle ? 'Testing...' : 'Test Connection'}
            </button>
          )}

          {puzzleStatus && (
            <p className={`text-sm ${puzzleStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {puzzleStatus}
            </p>
          )}

          <p className="text-xs text-gray-400">
            Get your API key from{' '}
            <a href="https://app.puzzle.io" target="_blank" rel="noopener noreferrer" className="underline">
              app.puzzle.io
            </a>{' '}
            → Settings → Integrations.
          </p>
        </div>
      </div>
    </div>
  )
}
