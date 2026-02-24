'use client'

import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Link from 'next/link'
import { useEffect } from 'react'

// Demo user — in production, derive from auth (Clerk, NextAuth, etc.)
const DEMO_USER_ID = 'demo-user'

export default function Home() {
  const seedDemo = useMutation(api.tenants.seedDemo)
  const tenants = useQuery(api.tenants.getForUser, { userId: DEMO_USER_ID })

  // Seed a demo tenant on first load
  useEffect(() => {
    seedDemo().catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LO Commission Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">Multi-tenant financial automation platform</p>
        </div>

        {/* Your Organizations */}
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Your Organizations
          </h2>

          {tenants === undefined ? (
            <div className="text-center py-4">
              <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No organizations yet.</p>
          ) : (
            tenants.map((tenant: any) => (
              <Link
                key={tenant._id}
                href={`/${tenant.slug}/dashboard`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{tenant.name}</p>
                    <p className="text-xs text-gray-400">/{tenant.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {tenant.plan}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Create new org */}
        <Link
          href="/onboarding"
          className="block w-full text-center py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
        >
          + Create New Organization
        </Link>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {['Plaid Bank Sync', 'QuickBooks', 'Puzzle', 'Auto-Reconcile'].map((f) => (
            <span key={f} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
