'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const LOAN_TYPE_OPTIONS = ['all', 'conventional', 'FHA', 'VA', 'USDA', 'jumbo']

const loanTypeColors: Record<string, string> = {
  conventional: 'bg-blue-100 text-blue-700',
  FHA: 'bg-green-100 text-green-700',
  VA: 'bg-purple-100 text-purple-700',
  USDA: 'bg-yellow-100 text-yellow-700',
  jumbo: 'bg-red-100 text-red-700',
}

export default function LenderDirectory() {
  const [search, setSearch] = useState('')
  const [loanType, setLoanType] = useState('all')

  const lenders = useQuery(api.lenders.list, {
    search: search || undefined,
    loanType: loanType !== 'all' ? loanType : undefined,
  })

  if (!lenders) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading lenders...</div>
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lenders or contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LOAN_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Loan Types' : t}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-2">{lenders.length} lender{lenders.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Lender Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lenders.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">No lenders match your search.</div>
        ) : (
          lenders.map((lender) => (
            <div key={lender._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{lender.name}</h3>
                {lender.website && (
                  <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                    {lender.website.replace('https://', '')}
                  </a>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {lender.contactName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${lender.contactEmail}`} className="hover:underline">{lender.contactEmail}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {lender.contactPhone}
                </div>
              </div>

              {/* Loan Types */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Loan Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {lender.loanTypes.map((t) => (
                    <span key={t} className={`px-2 py-0.5 rounded text-xs font-medium ${loanTypeColors[t] || 'bg-gray-100 text-gray-700'}`}>
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commission Rates */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Commission Rates</p>
                <div className="space-y-1">
                  {Object.entries(lender.commissionRates).map(([type, rate]) =>
                    rate !== undefined ? (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{type}</span>
                        <span className="font-semibold text-blue-700">{rate}%</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Notes */}
              {lender.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 italic">{lender.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
