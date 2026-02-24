'use client'

import { Id } from '../../convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface Props {
  tenantId: Id<'tenants'>
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function Dashboard({ tenantId }: Props) {
  const summary = useQuery(api.loans.summary, { tenantId })
  const loans = useQuery(api.loans.list, { tenantId })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Loans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalLoans ?? '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Closed Loans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.closedLoans ?? '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Commissions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {summary ? formatCurrency(summary.totalExpectedCommission) : '—'}
          </p>
        </div>
        <div className="bg-blue-600 rounded-xl p-5">
          <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Reconciliation Rate</p>
          <p className="text-2xl font-bold text-white mt-1">
            {summary ? `${summary.reconciliationRate}%` : '—'}
          </p>
        </div>
      </div>

      {/* Loans table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Loans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Loan #</th>
                <th className="px-6 py-3 text-left">Borrower</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Stage</th>
                <th className="px-6 py-3 text-right">Expected Commission</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans?.map((loan) => (
                <tr key={loan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-gray-600 text-xs">{loan.loanNumber}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{loan.borrowerName}</td>
                  <td className="px-6 py-3 text-gray-600 capitalize">{loan.loanType}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                      {loan.stage}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(loan.expectedCommission)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {loan.reconciledTransactionId ? (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-medium">
                        ✓ Reconciled
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
