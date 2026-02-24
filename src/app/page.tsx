'use client'

import { useState, useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import Pipeline from '@/components/Pipeline'
import LenderDirectory from '@/components/LenderDirectory'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const PASSPHRASE = process.env.NEXT_PUBLIC_PORTAL_PASSPHRASE || 'revolvemtg'
const SESSION_KEY = 'lo_portal_auth'

type Tab = 'dashboard' | 'pipeline' | 'lenders'

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const seedTransactions = useMutation(api.transactions.seed)
  const seedLoans = useMutation(api.loans.seed)
  const seedLenders = useMutation(api.lenders.seed)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored === 'true') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) {
      // Seed mock data on first load
      seedTransactions().catch(console.error)
      seedLoans().catch(console.error)
      seedLenders().catch(console.error)
    }
  }, [authed])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === PASSPHRASE) {
      setAuthed(true)
      sessionStorage.setItem(SESSION_KEY, 'true')
      setError('')
    } else {
      setError('Invalid passphrase. Please try again.')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LO Commission Portal</h1>
            <p className="text-gray-500 mt-1">Enter your passphrase to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Passphrase"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">LO Commission Portal</span>
            </div>
            <nav className="flex gap-1">
              {(['dashboard', 'pipeline', 'lenders'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'dashboard' ? 'Commission Dashboard' : tab === 'pipeline' ? 'Loan Pipeline' : 'Lender Directory'}
                </button>
              ))}
            </nav>
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pipeline' && <Pipeline />}
        {activeTab === 'lenders' && <LenderDirectory />}
      </main>
    </div>
  )
}
