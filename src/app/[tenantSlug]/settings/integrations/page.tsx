'use client'

import { use } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import TenantShell from '../../TenantShell'
import IntegrationsSettings from '@/components/IntegrationsSettings'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function IntegrationsPage({ params }: Props) {
  const { tenantSlug } = use(params)
  const tenant = useQuery(api.tenants.getBySlug, { slug: tenantSlug })

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <TenantShell tenant={tenant} activeTab="integrations">
      <IntegrationsSettings tenantId={tenant._id} />
    </TenantShell>
  )
}
