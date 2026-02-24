'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const STAGES = ['Application', 'Processing', 'Underwriting', 'Closing']

const stageColors: Record<string, string> = {
  Application: 'bg-gray-100 text-gray-700 border-gray-300',
  Processing: 'bg-blue-100 text-blue-700 border-blue-300',
  Underwriting: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Closing: 'bg-green-100 text-green-700 border-green-300',
}

const stageDotColors: Record<string, string> = {
  Application: 'bg-gray-400',
  Processing: 'bg-blue-500',
  Underwriting: 'bg-yellow-500',
  Closing: 'bg-green-500',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Pipeline() {
  const loans = useQuery(api.loans.list)

  if (!loans) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading pipeline...</div>
  }

  const totalProjected = loans.reduce((sum, l) => sum + l.projectedCommission, 0)
  const byStage: Record<string, typeof loans> = {}
  STAGES.forEach((s) => { byStage[s] = [] })
  loans.forEach((l) => { if (byStage[l.stage]) byStage[l.stage].push(l) })

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${stageDotColors[stage]}`}></span>
              <span className="text-sm font-medium text-gray-600">{stage}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{byStage[stage].length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(byStage[stage].reduce((s, l) => s + l.projectedCommission, 0))} projected
            </p>
          </div>
        ))}
      </div>

      {/* Total projected */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Total Pipeline — Projected Commission</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalProjected)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-blue-600">{loans.length} active loans</p>
          <p className="text-xs text-blue-400">across {STAGES.length} pipeline stages</p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Loans</h2>
          <p className="text-sm text-gray-500 mt-1">Track each loan through the pipeline</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lender</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Amount</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Closing</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proj. Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => {
                const days = daysUntil(loan.expectedClosingDate)
                return (
                  <tr key={loan._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{loan.borrowerName}</div>
                      <div className="text-xs text-gray-400 font-mono">****{loan.borrowerLastFourSSN}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stageColors[loan.stage]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageDotColors[loan.stage]}`}></span>
                        {loan.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 capitalize">{loan.loanType}</td>
                    <td className="px-6 py-4 text-gray-700">{loan.lender}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{loan.interestRate}%</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{loan.expectedClosingDate}</div>
                      <div className={`text-xs mt-0.5 ${days <= 14 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                        {days > 0 ? `${days} days` : days === 0 ? 'Today!' : `${Math.abs(days)} days overdue`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">{formatCurrency(loan.projectedCommission)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline stages visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Flow</h2>
        <div className="flex items-center gap-2">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 rounded-lg p-3 text-center border ${stageColors[stage]}`}>
                <div className="font-semibold text-sm">{stage}</div>
                <div className="text-lg font-bold mt-1">{byStage[stage].length}</div>
              </div>
              {i < STAGES.length - 1 && (
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
