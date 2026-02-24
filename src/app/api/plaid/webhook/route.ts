import { NextRequest, NextResponse } from "next/server";

/**
 * Plaid Webhook Handler
 *
 * Plaid sends webhook events when new transactions are available.
 * For local development, you need a public URL — use ngrok or Cloudflare Tunnel:
 *   npx ngrok http 3000
 *   cloudflared tunnel --url http://localhost:3000
 *
 * Then set your Plaid webhook URL in the Plaid dashboard to:
 *   https://<tunnel-url>/api/plaid/webhook
 *
 * Supported events:
 *   TRANSACTIONS:SYNC_UPDATES_AVAILABLE
 *   TRANSACTIONS:DEFAULT_UPDATE
 *   TRANSACTIONS:TRANSACTIONS_REMOVED
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`[Plaid Webhook] ${webhook_type}:${webhook_code}`, { item_id });

    if (
      webhook_type === "TRANSACTIONS" &&
      (webhook_code === "SYNC_UPDATES_AVAILABLE" ||
        webhook_code === "TRANSACTIONS_REMOVED" ||
        webhook_code === "DEFAULT_UPDATE")
    ) {
      // In production: look up plaidConnection by item_id → get tenantId,
      // then call syncTransactions + autoReconcile via Convex HTTP action.
      // For MVP: the UI polls for updates via the Plaid sync button.
      // TODO: lazy-import ConvexHttpClient here and run syncTransactions action
      // once itemId → tenantId lookup is indexed.
      console.log(`[Plaid Webhook] New transactions available for item_id=${item_id}`);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (err: any) {
    console.error("[Plaid Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
