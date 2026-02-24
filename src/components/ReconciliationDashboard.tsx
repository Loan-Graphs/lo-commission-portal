'use client'

import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface Props {
  tenantId: Id<'tenants'>
}

export default function ReconciliationDashboard({ tenantId }: Props) {
  const [selectedTxId, setSelectedTxId] = useState<Id<'transactions'> | null>(null)
  const [selectedLoanId, setSelectedLoanId] = useState<Id<'loans'> | null>(null)
  const [pushing, setPushing] = useState<string | null>(null)
  const [reconciling, setReconciling] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const transactions = useQuery(api.plaid.getAllTransactions, { tenantId })
  const loans = useQuery(api.loans.list, { tenantId })
  const confirmMatch = useMutation(api.plaid.confirmReconciliation)
  const autoReconcileAction = useAction(api.plaid.autoReconcile)
  const syncAction = useAction(api.plaid.syncTransactions)
  const pushQB = useAction(api.quickbooks.pushJournalEntry)
  const pushPuzzle = useAction(api.puzzle.pushToPuzzle)

  const handleAutoReconcile = async () => {
    setReconciling(true)
    setStatus(null)
    try {
      const result = await autoReconcileAction({ tenantId })
      setStatus(`Found ${result.suggestions.length} auto-match suggestion(s). Review and confirm below.`)
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setReconciling(false)
    }
  }

  const handleSync = async () => {
    setStatus('Syncing transactions from Plaid...')
    try {
      const result = await syncAction({ tenantId })
      setStatus(`Synced ${result.synced} new transactions.`)
    } catch (err: any) {
      setStatus(`Sync error: ${err.message}`)
    }
  }

  const handleConfirmMatch = async () => {
    if (!selectedTxId || !selectedLoanId) return
    try {
      await confirmMatch({ transactionId: selectedTxId, loanId: selectedLoanId })
      setSelectedTxId(null)
      setSelectedLoanId(null)
      setStatus('Match confirmed!')
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    }
  }

  const handlePushToAccounting = async (txId: Id<'transactions'>) => {
    setPushing(txId)
    setStatus(null)
    try {
      await Promise.allSettled([
        pushQB({ tenantId, transactionId: txId }).catch(() => null),
        pushPuzzle({ tenantId, transactionId: txId }).catch(() => null),
      ])
      setStatus('Pushed to accounting systems.')
    } catch (err: any) {
      setStatus(`Push error: ${err.message}`)
    } finally {
      setPushing(null)
    }
  }

  const unreconciledTxns = transactions?.filter((t) => !t.reconciledLoanId) ?? []
  const reconciledTxns = transactions?.filter((t) => t.reconciledLoanId) ?? []
  const openLoans = loans?.filter((l) => !l.reconciledTransactionId && (l.stage === 'funded' || l.stage === 'closed')) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reconciliation Dashboard</h2>
          <p className="text-sm text-gray-500">Match bank transactions to loan commissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 Sync Plaid
          </button>
          <button
            onClick={handleAutoReconcile}
            disabled={reconciling}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {reconciling ? 'Matching...' : '⚡ Auto-Match'}
          </button>
        </div>
      </div>

      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          {status}
        </div>
      )}

      {/* Manual match notice */}
      {selectedTxId && selectedLoanId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-yellow-800 font-medium">
            Ready to confirm match — transaction ↔ loan selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedTxId(null); setSelectedLoanId(null) }}
              className="px-3 py-1.5 text-sm border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmMatch}
              className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
            >
              Confirm Match
            </button>
          </div>
        </div>
      )}

      {/* Split View */}
      <div className="grid grid-cols-2 gap-6">
        {/* Transactions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Bank Transactions ({unreconciledTxns.length} unmatched)
          </h3>
          <div className="space-y-2">
            {unreconciledTxns.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                No unmatched transactions. Connect a bank account to get started.
              </p>
            ) : (
              unreconciledTxns.map((tx) => (
                <div
                  key={tx._id}
                  onClick={() => setSelectedTxId(tx._id === selectedTxId ? null : tx._id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTxId === tx._id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-orange-200 bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 truncate max-w-[60%]">
                      {tx.description}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${tx.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{tx.date}</span>
                    <span className="text-xs text-orange-600 font-medium">Unmatched</span>
                  </div>
                </div>
              ))
            )}

            {/* Reconciled transactions */}
            {reconciledTxns.map((tx) => (
              <div key={tx._id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 truncate max-w-[60%]">
                    {tx.description}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${tx.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{tx.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700 font-medium">✓ Matched</span>
                    {tx.accountingPushedAt ? (
                      <span className="text-xs text-purple-600 font-medium">📊 Synced</span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePushToAccounting(tx._id) }}
                        disabled={pushing === tx._id}
                        className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                      >
                        {pushing === tx._id ? 'Pushing...' : 'Push to Accounting'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loans */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Unreconciled Loans ({openLoans.length} pending)
          </h3>
          <div className="space-y-2">
            {openLoans.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                No loans pending reconciliation.
              </p>
            ) : (
              openLoans.map((loan) => (
                <div
                  key={loan._id}
                  onClick={() => setSelectedLoanId(loan._id === selectedLoanId ? null : loan._id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedLoanId === loan._id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">
                      {loan.borrowerName}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${loan.expectedCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      #{loan.loanNumber} • {loan.loanType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      loan.stage === 'funded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {loan.stage}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Already reconciled loans */}
            {loans?.filter((l) => l.reconciledTransactionId).map((loan) => (
              <div key={loan._id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">{loan.borrowerName}</span>
                  <span className="font-semibold text-gray-900">
                    ${loan.expectedCommission.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">#{loan.loanNumber}</span>
                  <span className="text-xs text-green-700 font-medium">✓ Reconciled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600 font-medium mb-1">How to reconcile manually:</p>
        <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1">
          <li>Click a transaction (left) to select it (highlighted orange)</li>
          <li>Click a matching loan (right) to select it (highlighted blue)</li>
          <li>Click &quot;Confirm Match&quot; to link them</li>
          <li>Click &quot;Push to Accounting&quot; to sync to QuickBooks + Puzzle</li>
        </ol>
      </div>
    </div>
  )
}
