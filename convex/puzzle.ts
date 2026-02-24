import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─── Push Transaction to Puzzle ───────────────────────────────────────────────

/**
 * POSTs a reconciled transaction to the Puzzle API.
 * Auth: Bearer token (tenant's puzzleApiKey).
 * On success, stores puzzleEntryId on the transaction record.
 */
export const pushToPuzzle = action({
  args: {
    tenantId: v.id("tenants"),
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    // Fetch integration config
    const integration: any = await ctx.runQuery(api.puzzle.getIntegration, {
      tenantId: args.tenantId,
    });
    if (!integration?.active || !integration.apiKey) {
      throw new Error("Puzzle integration not connected or API key missing.");
    }

    // Fetch transaction + loan
    const tx: any = await ctx.runQuery(api.puzzle.getTransaction, {
      transactionId: args.transactionId,
    });
    if (!tx) throw new Error("Transaction not found.");

    let loanDescription = tx.description;
    if (tx.reconciledLoanId) {
      const loan: any = await ctx.runQuery(api.puzzle.getLoan, {
        loanId: tx.reconciledLoanId,
      });
      if (loan) {
        loanDescription = `Loan #${loan.loanNumber} — ${loan.borrowerName}`;
      }
    }

    // POST to Puzzle API
    const response = await fetch("https://api.puzzle.io/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: tx.date,
        amount: tx.amount,
        description: loanDescription,
        category: "Commission Income",
        externalId: tx.plaidTransactionId,
        metadata: {
          source: "lo-commission-portal",
          tenantId: args.tenantId,
          transactionId: args.transactionId,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Puzzle API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const puzzleEntryId = data.id ?? data.transactionId ?? "pushed";

    await ctx.runMutation(api.puzzle.markPushed, {
      transactionId: args.transactionId,
      puzzleEntryId,
    });

    return { success: true, puzzleEntryId };
  },
});

// ─── Test Connection ──────────────────────────────────────────────────────────

/**
 * Validates that the stored Puzzle API key is functional.
 */
export const testConnection = action({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const integration: any = await ctx.runQuery(api.puzzle.getIntegration, {
      tenantId: args.tenantId,
    });
    if (!integration?.apiKey) {
      return { ok: false, message: "No API key stored." };
    }

    const response = await fetch("https://api.puzzle.io/v1/me", {
      headers: { Authorization: `Bearer ${integration.apiKey}` },
    });

    if (response.ok) {
      return { ok: true, message: "Connected to Puzzle successfully." };
    }
    return {
      ok: false,
      message: `Puzzle returned ${response.status}. Check your API key.`,
    };
  },
});

// ─── Save API Key ─────────────────────────────────────────────────────────────

export const saveApiKey = mutation({
  args: {
    tenantId: v.id("tenants"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Remove existing Puzzle integration
    const existing = await ctx.db
      .query("accountingIntegrations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    for (const e of existing) {
      if (e.provider === "puzzle") await ctx.db.delete(e._id);
    }

    return await ctx.db.insert("accountingIntegrations", {
      tenantId: args.tenantId,
      provider: "puzzle",
      apiKey: args.apiKey,
      active: true,
      connectedAt: Date.now(),
    });
  },
});

// ─── Queries & Mutations ──────────────────────────────────────────────────────

export const getIntegration = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("accountingIntegrations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    return integrations.find((i) => i.provider === "puzzle") ?? null;
  },
});

export const getTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => ctx.db.get(args.transactionId),
});

export const getLoan = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => ctx.db.get(args.loanId),
});

export const markPushed = mutation({
  args: {
    transactionId: v.id("transactions"),
    puzzleEntryId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      accountingPushedAt: Date.now(),
      puzzleEntryId: args.puzzleEntryId,
    });
  },
});
