import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lenders")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const seed = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lenders")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    if (existing.length > 0) return { seeded: false };

    const mockLenders = [
      {
        name: "United Wholesale Mortgage",
        contactName: "Sarah Thompson",
        contactEmail: "sthompson@uwm.com",
        contactPhone: "800-555-1234",
        loanTypes: ["conventional", "FHA", "VA", "jumbo"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5, jumbo: 1.25 },
        website: "https://www.uwm.com",
        notes: "Top wholesale lender, fast turnaround.",
      },
      {
        name: "Rocket Mortgage",
        contactName: "James Rivera",
        contactEmail: "jrivera@rocketmortgage.com",
        contactPhone: "800-555-5678",
        loanTypes: ["conventional", "FHA", "VA"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5 },
        website: "https://www.rocketmortgage.com",
        notes: "Good for digital-savvy borrowers.",
      },
      {
        name: "Chase",
        contactName: "Emily Chen",
        contactEmail: "emily.chen@chase.com",
        contactPhone: "800-555-9012",
        loanTypes: ["conventional", "jumbo"],
        commissionRates: { conventional: 1.25, jumbo: 1.0 },
        website: "https://www.chase.com/personal/mortgage",
        notes: "Preferred for jumbo loans.",
      },
    ];

    for (const lender of mockLenders) {
      await ctx.db.insert("lenders", { ...lender, tenantId: args.tenantId });
    }
    return { seeded: true, count: mockLenders.length };
  },
});
