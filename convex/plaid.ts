import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlaidClient() {
  const {
    Configuration,
    PlaidApi,
    PlaidEnvironments,
  } = require("plaid") as typeof import("plaid");

  const env = process.env.PLAID_ENV || "sandbox";
  const config = new Configuration({
    basePath:
      env === "production"
        ? PlaidEnvironments.production
        : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  });
  return new PlaidApi(config);
}

// ─── Create Link Token ────────────────────────────────────────────────────────

/**
 * Called from the client to initialize Plaid Link.
 * Returns a short-lived link_token; the access_token is NEVER sent to client.
 */
export const createLinkToken = action({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  handler: async (_ctx, args) => {
    const client = getPlaidClient();
    const { Products, CountryCode } = require("plaid") as typeof import("plaid");

    const response = await client.linkTokenCreate({
      user: { client_user_id: args.userId },
      client_name: "LO Commission Portal",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return { linkToken: response.data.link_token };
  },
});

// ─── Exchange Public Token ────────────────────────────────────────────────────

/**
 * Called after Plaid Link succeeds. Exchanges the public_token for a
 * permanent access_token and stores it server-side.
 */
export const exchangePublicToken = action({
  args: {
    tenantId: v.id("tenants"),
    publicToken: v.string(),
  },
  handler: async (ctx, args) => {
    const client = getPlaidClient();

    // Exchange tokens
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: args.publicToken,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Fetch institution info
    const itemResponse = await client.itemGet({ access_token: accessToken });
    const institutionId = itemResponse.data.item.institution_id;

    let institutionName = "Unknown Bank";
    if (institutionId) {
      const instResponse = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: ["US"] as any,
      });
      institutionName = instResponse.data.institution.name;
    }

    // Fetch account IDs
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });
    const accountIds = accountsResponse.data.accounts.map((a: any) => a.account_id);

    // Store in Convex — access token stays server-side
    const connectionId: Id<"plaidConnections"> = await ctx.runMutation(
      api.plaid.storeConnection,
      {
        tenantId: args.tenantId,
        accessToken,
        itemId,
        institutionName,
        accountIds,
      }
    );

    return {
      success: true,
      connectionId,
      institutionName,
      accountCount: accountIds.length,
    };
  },
});

// ─── Store Connection (internal mutation) ────────────────────────────────────

export const storeConnection = mutation({
  args: {
    tenantId: v.id("tenants"),
    accessToken: v.string(),
    itemId: v.string(),
    institutionName: v.string(),
    accountIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("plaidConnections", {
      tenantId: args.tenantId,
      accessToken: args.accessToken,
      itemId: args.itemId,
      institutionName: args.institutionName,
      accountIds: args.accountIds,
      active: true,
    });
  },
});

// ─── Sync Transactions ────────────────────────────────────────────────────────

/**
 * Syncs up to 90 days of transactions for all active Plaid connections
 * belonging to a tenant. Upserts into the transactions table.
 */
export const syncTransactions = action({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const connections: any[] = await ctx.runQuery(api.plaid.getConnections, {
      tenantId: args.tenantId,
    });

    let totalSynced = 0;

    for (const connection of connections) {
      if (!connection.active) continue;

      const client = getPlaidClient();

      // Use transactions/sync for incremental updates
      let cursor: string | undefined;
      let hasMore = true;
      const added: any[] = [];

      while (hasMore) {
        const response = await client.transactionsSync({
          access_token: connection.accessToken,
          cursor,
        });
        added.push(...response.data.added);
        cursor = response.data.next_cursor;
        hasMore = response.data.has_more;
      }

      // Upsert each transaction
      for (const tx of added) {
        await ctx.runMutation(api.plaid.upsertTransaction, {
          tenantId: args.tenantId,
          plaidConnectionId: connection._id,
          plaidTransactionId: tx.transaction_id,
          amount: Math.abs(tx.amount), // Plaid uses negative for deposits
          date: tx.date,
          description: tx.name || tx.merchant_name || "Unknown",
          merchantName: tx.merchant_name || undefined,
          category: tx.personal_finance_category?.primary || undefined,
        });
      }

      totalSynced += added.length;

      // Update lastSyncedAt
      await ctx.runMutation(api.plaid.updateLastSynced, {
        connectionId: connection._id,
      });
    }

    return { synced: totalSynced };
  },
});

// ─── Upsert Transaction (internal mutation) ──────────────────────────────────

export const upsertTransaction = mutation({
  args: {
    tenantId: v.id("tenants"),
    plaidConnectionId: v.id("plaidConnections"),
    plaidTransactionId: v.string(),
    amount: v.number(),
    date: v.string(),
    description: v.string(),
    merchantName: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_plaid_id", (q) =>
        q.eq("plaidTransactionId", args.plaidTransactionId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("transactions", {
      tenantId: args.tenantId,
      plaidConnectionId: args.plaidConnectionId,
      plaidTransactionId: args.plaidTransactionId,
      amount: args.amount,
      date: args.date,
      description: args.description,
      merchantName: args.merchantName,
      category: args.category,
      createdAt: Date.now(),
    });
  },
});

export const updateLastSynced = mutation({
  args: { connectionId: v.id("plaidConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, { lastSyncedAt: Date.now() });
  },
});

// ─── Auto-Reconcile ───────────────────────────────────────────────────────────

/**
 * Non-destructive: matches unreconciled transactions to loans based on:
 * - Amount within 5% of expectedCommission
 * - Date within 30 days of loan closedAt
 * Prioritizes exact matches first, then fuzzy.
 * Always creates suggestions — never auto-confirms without user review.
 */
export const autoReconcile = action({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const [unreconciledTxns, openLoans]: [any[], any[]] = await Promise.all([
      ctx.runQuery(api.plaid.getUnreconciledTransactions, {
        tenantId: args.tenantId,
      }),
      ctx.runQuery(api.plaid.getUnreconciledLoans, {
        tenantId: args.tenantId,
      }),
    ]);

    const suggestions: Array<{
      transactionId: Id<"transactions">;
      loanId: Id<"loans">;
      confidence: "exact" | "fuzzy";
      amountDiff: number;
    }> = [];

    for (const tx of unreconciledTxns) {
      let bestMatch: (typeof suggestions)[0] | null = null;

      for (const loan of openLoans) {
        // Amount check: within 5%
        const tolerance = loan.expectedCommission * 0.05;
        const amountDiff = Math.abs(tx.amount - loan.expectedCommission);
        if (amountDiff > tolerance) continue;

        // Date check: within 30 days of loan closedAt
        if (!loan.closedAt) continue;
        const txDate = new Date(tx.date).getTime();
        const closedAt = loan.closedAt;
        const daysDiff = Math.abs(txDate - closedAt) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) continue;

        const confidence = amountDiff === 0 ? "exact" : "fuzzy";

        // Prefer exact over fuzzy; prefer smaller diff
        if (
          !bestMatch ||
          (confidence === "exact" && bestMatch.confidence !== "exact") ||
          (confidence === bestMatch.confidence && amountDiff < bestMatch.amountDiff)
        ) {
          bestMatch = {
            transactionId: tx._id,
            loanId: loan._id,
            confidence,
            amountDiff,
          };
        }
      }

      if (bestMatch) {
        suggestions.push(bestMatch);
      }
    }

    return { suggestions };
  },
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getConnections = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plaidConnections")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const getUnreconciledTransactions = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("transactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    return all.filter((t) => !t.reconciledLoanId);
  },
});

export const getUnreconciledLoans = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const funded = await ctx.db
      .query("loans")
      .withIndex("by_tenant_stage", (q) =>
        q.eq("tenantId", args.tenantId).eq("stage", "funded")
      )
      .collect();
    const closed = await ctx.db
      .query("loans")
      .withIndex("by_tenant_stage", (q) =>
        q.eq("tenantId", args.tenantId).eq("stage", "closed")
      )
      .collect();
    return [...funded, ...closed].filter((l) => !l.reconciledTransactionId);
  },
});

export const getAllTransactions = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

// ─── Confirm Reconciliation ───────────────────────────────────────────────────

export const confirmReconciliation = mutation({
  args: {
    transactionId: v.id("transactions"),
    loanId: v.id("loans"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.transactionId, {
      reconciledLoanId: args.loanId,
      reconciledAt: now,
    });
    await ctx.db.patch(args.loanId, {
      reconciledTransactionId: args.transactionId,
      reconciledAt: now,
    });
    return { success: true };
  },
});
