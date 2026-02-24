import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("loans")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const listByStage = query({
  args: { tenantId: v.id("tenants"), stage: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("loans")
      .withIndex("by_tenant_stage", (q) =>
        q.eq("tenantId", args.tenantId).eq("stage", args.stage)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    loanNumber: v.string(),
    borrowerName: v.string(),
    loanAmount: v.number(),
    loanType: v.string(),
    lenderId: v.optional(v.string()),
    stage: v.string(),
    expectedCommission: v.number(),
    closedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("loans", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: { loanId: v.id("loans"), stage: v.string() },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { stage: args.stage };
    if (args.stage === "funded" || args.stage === "closed") {
      patch.closedAt = Date.now();
    }
    await ctx.db.patch(args.loanId, patch);
  },
});

export const summary = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const closed = loans.filter(
      (l) => l.stage === "funded" || l.stage === "closed"
    );
    const reconciled = closed.filter((l) => l.reconciledTransactionId);
    const reconciliationRate =
      closed.length > 0 ? (reconciled.length / closed.length) * 100 : 0;

    const totalExpectedCommission = closed.reduce(
      (sum, l) => sum + l.expectedCommission,
      0
    );
    const totalReceivedCommission = reconciled.reduce(
      (sum, l) => sum + (l.receivedCommission ?? l.expectedCommission),
      0
    );

    return {
      totalLoans: loans.length,
      closedLoans: closed.length,
      reconciledLoans: reconciled.length,
      reconciliationRate: Math.round(reconciliationRate),
      totalExpectedCommission,
      totalReceivedCommission,
    };
  },
});

export const seed = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("loans")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    if (existing.length > 0) return { seeded: false };

    const mockLoans = [
      {
        loanNumber: "LN-2026-001",
        borrowerName: "Michael Johnson",
        loanAmount: 450000,
        loanType: "conventional",
        stage: "closing",
        expectedCommission: 6750,
        closedAt: undefined as number | undefined,
      },
      {
        loanNumber: "LN-2026-002",
        borrowerName: "Sarah Williams",
        loanAmount: 310000,
        loanType: "FHA",
        stage: "underwriting",
        expectedCommission: 4650,
        closedAt: undefined as number | undefined,
      },
      {
        loanNumber: "LN-2026-003",
        borrowerName: "David Martinez",
        loanAmount: 625000,
        loanType: "jumbo",
        stage: "funded",
        expectedCommission: 7812,
        closedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      },
      {
        loanNumber: "LN-2026-004",
        borrowerName: "Jennifer Lee",
        loanAmount: 275000,
        loanType: "VA",
        stage: "application",
        expectedCommission: 4125,
        closedAt: undefined as number | undefined,
      },
      {
        loanNumber: "LN-2026-005",
        borrowerName: "Robert Chen",
        loanAmount: 395000,
        loanType: "conventional",
        stage: "closed",
        expectedCommission: 5925,
        closedAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
      },
    ];

    for (const loan of mockLoans) {
      await ctx.db.insert("loans", {
        tenantId: args.tenantId,
        loanNumber: loan.loanNumber,
        borrowerName: loan.borrowerName,
        loanAmount: loan.loanAmount,
        loanType: loan.loanType,
        stage: loan.stage,
        expectedCommission: loan.expectedCommission,
        closedAt: loan.closedAt,
        createdAt: Date.now(),
      });
    }
    return { seeded: true, count: mockLoans.length };
  },
});
