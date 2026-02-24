import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Multi-Tenant Core ───────────────────────────────────────────────────────

  // Tenants (each LO firm / mortgage company)
  tenants: defineTable({
    name: v.string(),
    slug: v.string(), // URL slug: portal.com/[slug]
    logoUrl: v.optional(v.string()),
    plan: v.string(), // "starter" | "pro" | "enterprise"
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Tenant membership
  tenantUsers: defineTable({
    tenantId: v.id("tenants"),
    userId: v.string(), // Clerk / auth user ID
    role: v.string(), // "owner" | "admin" | "member"
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"]),

  // ─── Plaid ───────────────────────────────────────────────────────────────────

  // Plaid connections (one per bank account link)
  plaidConnections: defineTable({
    tenantId: v.id("tenants"),
    accessToken: v.string(), // stored server-side only, never exposed to client
    itemId: v.string(),
    institutionName: v.string(),
    accountIds: v.array(v.string()),
    lastSyncedAt: v.optional(v.number()),
    active: v.boolean(),
  }).index("by_tenant", ["tenantId"]),

  // Plaid transactions pulled from bank
  transactions: defineTable({
    tenantId: v.id("tenants"),
    plaidConnectionId: v.id("plaidConnections"),
    plaidTransactionId: v.string(),
    amount: v.number(),
    date: v.string(), // "YYYY-MM-DD"
    description: v.string(),
    merchantName: v.optional(v.string()),
    category: v.optional(v.string()),
    reconciledLoanId: v.optional(v.id("loans")),
    reconciledAt: v.optional(v.number()),
    accountingPushedAt: v.optional(v.number()),
    qbEntryId: v.optional(v.string()),
    puzzleEntryId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_plaid_id", ["plaidTransactionId"]),

  // ─── Loans ───────────────────────────────────────────────────────────────────

  // Loans (tenant-scoped, replaces old single-tenant loans table)
  loans: defineTable({
    tenantId: v.id("tenants"),
    loanNumber: v.string(),
    borrowerName: v.string(),
    loanAmount: v.number(),
    loanType: v.string(), // "conventional" | "FHA" | "VA" | "USDA" | "jumbo"
    lenderId: v.optional(v.string()),
    stage: v.string(), // "application" | "processing" | "underwriting" | "closing" | "funded" | "closed"
    expectedCommission: v.number(),
    receivedCommission: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    reconciledAt: v.optional(v.number()),
    reconciledTransactionId: v.optional(v.id("transactions")),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_stage", ["tenantId", "stage"]),

  // ─── Lenders ─────────────────────────────────────────────────────────────────

  lenders: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    loanTypes: v.array(v.string()),
    commissionRates: v.object({
      conventional: v.optional(v.number()),
      FHA: v.optional(v.number()),
      VA: v.optional(v.number()),
      USDA: v.optional(v.number()),
      jumbo: v.optional(v.number()),
    }),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_tenant", ["tenantId"]),

  // ─── Accounting Integrations ──────────────────────────────────────────────────

  accountingIntegrations: defineTable({
    tenantId: v.id("tenants"),
    provider: v.string(), // "quickbooks" | "puzzle"
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    realmId: v.optional(v.string()), // QuickBooks company ID
    apiKey: v.optional(v.string()), // Puzzle API key
    tokenExpiresAt: v.optional(v.number()),
    active: v.boolean(),
    connectedAt: v.number(),
  }).index("by_tenant", ["tenantId"]),
});
