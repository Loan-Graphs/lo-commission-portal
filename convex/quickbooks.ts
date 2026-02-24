import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─── Push Journal Entry to QuickBooks ────────────────────────────────────────

/**
 * Creates a QuickBooks Journal Entry for a reconciled transaction:
 *   DR: Bank/Checking account
 *   CR: Commission Income account
 * Memo includes loan number + borrower name.
 * Auto-refreshes token if expired.
 */
export const pushJournalEntry = action({
  args: {
    tenantId: v.id("tenants"),
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    // Fetch integration config
    const integration: any = await ctx.runQuery(
      api.quickbooks.getIntegration,
      { tenantId: args.tenantId }
    );
    if (!integration?.active) {
      throw new Error("QuickBooks integration not connected for this tenant.");
    }

    // Fetch transaction + reconciled loan
    const tx: any = await ctx.runQuery(api.quickbooks.getTransaction, {
      transactionId: args.transactionId,
    });
    if (!tx) throw new Error("Transaction not found.");
    if (!tx.reconciledLoanId) throw new Error("Transaction not yet reconciled to a loan.");

    const loan: any = await ctx.runQuery(api.quickbooks.getLoan, {
      loanId: tx.reconciledLoanId,
    });
    if (!loan) throw new Error("Reconciled loan not found.");

    // Check if token needs refresh
    let accessToken = integration.accessToken;
    if (
      integration.tokenExpiresAt &&
      integration.tokenExpiresAt < Date.now() + 60_000
    ) {
      const refreshed = await refreshQbToken(
        integration.refreshToken,
        integration.realmId
      );
      accessToken = refreshed.accessToken;
      await ctx.runMutation(api.quickbooks.updateTokens, {
        integrationId: integration._id,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      });
    }

    const realmId = integration.realmId;
    const memo = `Loan #${loan.loanNumber} — ${loan.borrowerName}`;

    // QuickBooks Online API: create Journal Entry
    const journalEntry = {
      DocNumber: loan.loanNumber,
      TxnDate: tx.date,
      PrivateNote: memo,
      Line: [
        {
          // Debit: Bank/Checking
          Amount: tx.amount,
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: "Debit",
            AccountRef: { name: "Checking", value: "35" }, // Sandbox account ID
          },
          Description: memo,
        },
        {
          // Credit: Commission Income
          Amount: tx.amount,
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: "Credit",
            AccountRef: { name: "Commission Income", value: "64" }, // Sandbox account ID
          },
          Description: memo,
        },
      ],
    };

    const qboBaseUrl =
      process.env.QB_ENVIRONMENT === "production"
        ? "https://quickbooks.api.intuit.com"
        : "https://sandbox-quickbooks.api.intuit.com";

    const response = await fetch(
      `${qboBaseUrl}/v3/company/${realmId}/journalentry`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(journalEntry),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`QuickBooks API error: ${err}`);
    }

    const data = await response.json();
    const qbEntryId = data.JournalEntry?.Id;

    // Store QB entry ID on transaction
    await ctx.runMutation(api.quickbooks.markPushed, {
      transactionId: args.transactionId,
      qbEntryId,
    });

    return { success: true, qbEntryId };
  },
});

// ─── Token Refresh ────────────────────────────────────────────────────────────

async function refreshQbToken(
  refreshToken: string,
  _realmId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const { default: OAuthClient } = await import("intuit-oauth");

  const oauthClient = new OAuthClient({
    clientId: process.env.QB_CLIENT_ID!,
    clientSecret: process.env.QB_CLIENT_SECRET!,
    environment: process.env.QB_ENVIRONMENT || "sandbox",
    redirectUri: process.env.QB_REDIRECT_URI!,
  });

  oauthClient.setToken({ refresh_token: refreshToken });
  await oauthClient.refresh();

  const token = oauthClient.getToken();
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  };
}

// ─── Queries & Mutations ──────────────────────────────────────────────────────

export const getIntegration = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("accountingIntegrations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    return integrations.find((i) => i.provider === "quickbooks") ?? null;
  },
});

export const getTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transactionId);
  },
});

export const getLoan = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.loanId);
  },
});

export const updateTokens = mutation({
  args: {
    integrationId: v.id("accountingIntegrations"),
    accessToken: v.string(),
    refreshToken: v.string(),
    tokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });
  },
});

export const markPushed = mutation({
  args: {
    transactionId: v.id("transactions"),
    qbEntryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      accountingPushedAt: Date.now(),
      qbEntryId: args.qbEntryId,
    });
  },
});

export const storeIntegration = mutation({
  args: {
    tenantId: v.id("tenants"),
    accessToken: v.string(),
    refreshToken: v.string(),
    realmId: v.string(),
    tokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Remove any existing QB integration for this tenant
    const existing = await ctx.db
      .query("accountingIntegrations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    for (const e of existing) {
      if (e.provider === "quickbooks") await ctx.db.delete(e._id);
    }

    return await ctx.db.insert("accountingIntegrations", {
      tenantId: args.tenantId,
      provider: "quickbooks",
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      realmId: args.realmId,
      tokenExpiresAt: args.tokenExpiresAt,
      active: true,
      connectedAt: Date.now(),
    });
  },
});
