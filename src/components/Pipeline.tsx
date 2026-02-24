'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface Props {
  tenantId: Id<'tenants'>
}

const STAGES = ['application', 'processing', 'underwriting', 'closing', 'funded', 'closed']

const STAGE_COLORS: Record<string, string> = {
  application: 'bg-gray-100 text-gray-600',
  processing: 'bg-yellow-100 text-yellow-700',
  underwriting: 'bg-orange-100 text-orange-700',
  closing: 'bg-blue-100 text-blue-700',
  funded: 'bg-green-100 text-green-700',
  closed: 'bg-purple-100 text-purple-700',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Pipeline({ tenantId }: Props) {
  const loans = useQuery(api.loans.list, { tenantId })

  const byStage = STAGES.reduce<Record<string, typeof loans>>((acc, stage) => {
    acc[stage] = loans?.filter((l) => l.stage === stage) ?? []
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Loan Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">{loans?.length ?? 0} loans across all stages</p>
      </div>

      {/* Kanban-style columns */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const stageLoans = byStage[stage] ?? []
          return (
            <div key={stage} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STAGE_COLORS[stage]}`}>
                  {stage}
                </span>
                <span className="text-xs text-gray-400 font-medium">{stageLoans.length}</span>
              </div>
              <div className="space-y-2">
                {stageLoans.map((loan) => (
                  <div key={loan._id} className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                    <p className="text-xs font-semibold text-gray-900 truncate">{loan.borrowerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(loan.expectedCommission)}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{loan.loanType}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
