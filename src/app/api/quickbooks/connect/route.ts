import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quickbooks/connect?tenantId=xxx
 * Redirects user to the QuickBooks OAuth authorization URL.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const OAuthClient = (await import("intuit-oauth")).default;
    const oauthClient = new OAuthClient({
      clientId: process.env.QB_CLIENT_ID!,
      clientSecret: process.env.QB_CLIENT_SECRET!,
      environment: process.env.QB_ENVIRONMENT || "sandbox",
      redirectUri: process.env.QB_REDIRECT_URI!,
    });

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: tenantId, // Pass tenantId through state param
    });

    return NextResponse.redirect(authUri);
  } catch (err: any) {
    console.error("[QB Connect]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
