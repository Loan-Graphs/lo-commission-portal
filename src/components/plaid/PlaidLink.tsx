'use client'

import { useCallback, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface PlaidLinkProps {
  tenantId: Id<'tenants'>
  userId?: string
  onSuccess?: () => void
}

export default function PlaidLink({ tenantId, userId = 'demo-user', onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const connections = useQuery(api.plaid.getConnections, { tenantId })

  const fetchLinkToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create link token')
      setLinkToken(data.linkToken)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSuccess = useCallback(
    async (publicToken: string) => {
      try {
        setLoading(true)
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, publicToken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to connect bank')
        setConnected(true)
        onSuccess?.()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        setLinkToken(null)
      }
    },
    [tenantId, onSuccess]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: (publicToken) => handleSuccess(publicToken),
    onExit: () => {
      setLinkToken(null)
      setLoading(false)
    },
  })

  // Auto-open Plaid Link when we have a token
  if (linkToken && ready) {
    open()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Bank Account</h3>
          <p className="text-sm text-gray-500">
            Connect your bank to automatically pull commission payments
          </p>
        </div>
        <button
          onClick={fetchLinkToken}
          disabled={loading || !!(linkToken && ready)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Connecting...' : '+ Connect Bank Account'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {connected && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Bank account connected successfully!
        </div>
      )}

      {/* Connected Accounts List */}
      {connections && connections.length > 0 && (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn._id}
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{conn.institutionName}</p>
                  <p className="text-xs text-gray-500">
                    {conn.accountIds.length} account{conn.accountIds.length !== 1 ? 's' : ''} •{' '}
                    {conn.lastSyncedAt
                      ? `Synced ${new Date(conn.lastSyncedAt).toLocaleDateString()}`
                      : 'Not yet synced'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  conn.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {conn.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sandbox hint */}
      <p className="text-xs text-gray-400">
        🔒 Powered by Plaid — your credentials are never stored. Sandbox: use{' '}
        <code className="font-mono bg-gray-100 px-1 rounded">user_good</code> /{' '}
        <code className="font-mono bg-gray-100 px-1 rounded">pass_good</code>
      </p>
    </div>
  )
}
