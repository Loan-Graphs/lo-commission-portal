'use client'

import Link from 'next/link'

type Tab = 'dashboard' | 'reconciliation' | 'integrations'

interface Tenant {
  _id: string
  name: string
  slug: string
  plan: string
}

interface Props {
  tenant: Tenant
  activeTab: Tab
  children: React.ReactNode
}

const tabs: { id: Tab; label: string; href: (slug: string) => string }[] = [
  { id: 'dashboard', label: 'Dashboard', href: (s) => `/${s}/dashboard` },
  { id: 'reconciliation', label: 'Reconciliation', href: (s) => `/${s}/reconciliation` },
  { id: 'integrations', label: 'Integrations', href: (s) => `/${s}/settings/integrations` },
]

export default function TenantShell({ tenant, activeTab, children }: Props) {
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
              <div>
                <span className="font-bold text-gray-900 text-base">{tenant.name}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                  {tenant.plan}
                </span>
              </div>
            </div>

            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href(tenant.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← All Orgs
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
