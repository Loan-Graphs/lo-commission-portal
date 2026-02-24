'use client'

import { use } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import TenantShell from '../TenantShell'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function DashboardPage({ params }: Props) {
  const { tenantSlug } = use(params)
  const tenant = useQuery(api.tenants.getBySlug, { slug: tenantSlug })
  const summary = useQuery(
    api.loans.summary,
    tenant ? { tenantId: tenant._id } : 'skip'
  )
  const loans = useQuery(
    api.loans.list,
    tenant ? { tenantId: tenant._id } : 'skip'
  )

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading tenant...</p>
      </div>
    )
  }

  return (
    <TenantShell tenant={tenant} activeTab="dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Loans"
            value={summary?.totalLoans ?? 0}
          />
          <StatCard
            label="Expected Commissions"
            value={`$${(summary?.totalExpectedCommission ?? 0).toLocaleString()}`}
          />
          <StatCard
            label="Received Commissions"
            value={`$${(summary?.totalReceivedCommission ?? 0).toLocaleString()}`}
          />
          <StatCard
            label="Reconciliation Rate"
            value={`${summary?.reconciliationRate ?? 0}%`}
            highlight={true}
          />
        </div>

        {/* Loans table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Loan Pipeline</h3>
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
                  <th className="px-6 py-3 text-center">Reconciled</th>
                  <th className="px-6 py-3 text-center">Acctg Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans?.map((loan) => (
                  <tr key={loan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-600">{loan.loanNumber}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{loan.borrowerName}</td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{loan.loanType}</td>
                    <td className="px-6 py-3">
                      <StageBadge stage={loan.stage} />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      ${loan.expectedCommission.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {loan.reconciledTransactionId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          ✓ Reconciled
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {/* TODO: check accounting synced status */}
                      <span className="text-xs text-gray-400">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TenantShell>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`p-5 rounded-xl border ${
        highlight
          ? 'bg-blue-600 border-blue-700 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    application: 'bg-gray-100 text-gray-600',
    processing: 'bg-yellow-100 text-yellow-700',
    underwriting: 'bg-orange-100 text-orange-700',
    closing: 'bg-blue-100 text-blue-700',
    funded: 'bg-green-100 text-green-700',
    closed: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[stage] ?? 'bg-gray-100 text-gray-600'}`}>
      {stage}
    </span>
  )
}
