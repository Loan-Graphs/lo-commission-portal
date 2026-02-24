'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const LOAN_TYPES = ['all', 'conventional', 'FHA', 'VA', 'USDA', 'jumbo']
const LENDERS = ['all', 'United Wholesale Mortgage', 'Rocket Mortgage', 'Chase', 'Veterans United', 'Guaranteed Rate', 'loanDepot']

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function Dashboard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loanType, setLoanType] = useState('all')
  const [lender, setLender] = useState('all')

  const summary = useQuery(api.transactions.summary)
  const transactions = useQuery(api.transactions.list, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    loanType: loanType !== 'all' ? loanType : undefined,
    lender: lender !== 'all' ? lender : undefined,
  })

  const exportCSV = () => {
    if (!transactions) return
    const headers = ['Date', 'Borrower (Last 4 SSN)', 'Loan Amount', 'Loan Type', 'Lender', 'Commission Rate %', 'Gross Commission', 'Fee Deductions', 'Splits', 'Net Commission', 'Status']
    const rows = transactions.map((t) => [
      t.date,
      `****${t.borrowerLastFourSSN}`,
      t.loanAmount,
      t.loanType,
      t.lender,
      `${t.commissionRate}%`,
      t.grossCommission,
      t.feeDeductions,
      t.splits,
      t.netCommission,
      t.status,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!summary || !transactions) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading commission data...</div>
  }

  const loanTypeColors: Record<string, string> = {
    conventional: 'bg-blue-100 text-blue-800',
    FHA: 'bg-green-100 text-green-800',
    VA: 'bg-purple-100 text-purple-800',
    USDA: 'bg-yellow-100 text-yellow-800',
    jumbo: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Current Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(summary.currentMonthTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Net commissions earned</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">YTD Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(summary.ytdTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.transactionCount} closed loans</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">YTD Fee Deductions</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{formatCurrency(summary.totalFeeDeductions)}</p>
          <p className="text-xs text-gray-400 mt-1">Processing & compliance fees</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">YTD Splits</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{formatCurrency(summary.totalSplits)}</p>
          <p className="text-xs text-gray-400 mt-1">Broker / team splits</p>
        </div>
      </div>

      {/* Breakdown by Loan Type */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">YTD Breakdown by Loan Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(summary.byLoanType).map(([type, amount]) => (
            <div key={type} className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${loanTypeColors[type] || 'bg-gray-100 text-gray-800'}`}>
                {type.toUpperCase()}
              </span>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Deductions Detail */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Deductions & Splits — YTD Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-medium">Category</th>
                <th className="text-right py-2 text-gray-600 font-medium">Amount</th>
                <th className="text-right py-2 text-gray-600 font-medium">% of Gross</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-gray-900">Processing Fees</td>
                <td className="py-3 text-right text-red-600 font-medium">{formatCurrency(summary.totalFeeDeductions * 0.6)}</td>
                <td className="py-3 text-right text-gray-500">{((summary.totalFeeDeductions * 0.6 / (summary.ytdTotal + summary.totalFeeDeductions + summary.totalSplits)) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-gray-900">Compliance / E&O</td>
                <td className="py-3 text-right text-red-600 font-medium">{formatCurrency(summary.totalFeeDeductions * 0.4)}</td>
                <td className="py-3 text-right text-gray-500">{((summary.totalFeeDeductions * 0.4 / (summary.ytdTotal + summary.totalFeeDeductions + summary.totalSplits)) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-gray-900">Broker / Team Split</td>
                <td className="py-3 text-right text-orange-600 font-medium">{formatCurrency(summary.totalSplits)}</td>
                <td className="py-3 text-right text-gray-500">{((summary.totalSplits / (summary.ytdTotal + summary.totalFeeDeductions + summary.totalSplits)) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="font-bold">
                <td className="py-3 text-gray-900">Net to LO</td>
                <td className="py-3 text-right text-green-600">{formatCurrency(summary.ytdTotal)}</td>
                <td className="py-3 text-right text-green-600">{((summary.ytdTotal / (summary.ytdTotal + summary.totalFeeDeductions + summary.totalSplits)) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LOAN_TYPES.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lender</label>
              <select
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LENDERS.map((l) => <option key={l} value={l}>{l === 'all' ? 'All Lenders' : l}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lender</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Amount</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Comm.</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Comm.</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-400">No transactions found for the selected filters.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{t.date}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">****{t.borrowerLastFourSSN}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${loanTypeColors[t.loanType] || 'bg-gray-100 text-gray-700'}`}>
                        {t.loanType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{t.lender}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{formatCurrency(t.loanAmount)}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(t.grossCommission)}</td>
                    <td className="px-6 py-4 text-right text-red-500">-{formatCurrency(t.feeDeductions + t.splits)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(t.netCommission)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
