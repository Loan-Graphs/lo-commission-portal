'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface Props {
  tenantId: Id<'tenants'>
}

export default function LenderDirectory({ tenantId }: Props) {
  const lenders = useQuery(api.lenders.list, { tenantId })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Lender Directory</h2>
        <p className="text-sm text-gray-500 mt-1">{lenders?.length ?? 0} lenders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lenders?.map((lender) => (
          <div key={lender._id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">{lender.name}</h3>
              <p className="text-sm text-gray-500">{lender.contactName}</p>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-gray-600">{lender.contactEmail}</p>
              <p className="text-gray-600">{lender.contactPhone}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {lender.loanTypes.map((type) => (
                <span
                  key={type}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                >
                  {type}
                </span>
              ))}
            </div>
            {lender.notes && (
              <p className="text-xs text-gray-400 italic">{lender.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
