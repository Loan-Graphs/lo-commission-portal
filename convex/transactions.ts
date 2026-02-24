import { query } from "./_generated/server";
import { v } from "convex/values";

// Convenience re-exports for the legacy single-tenant API (not used in multi-tenant UI)
// The primary transaction functions are in convex/plaid.ts

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
