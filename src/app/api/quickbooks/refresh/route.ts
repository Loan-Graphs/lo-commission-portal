import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quickbooks/refresh
 * Body: { tenantId: string }
 * Refreshes an expired QB access token and updates it in Convex.
 */
export async function POST(req: NextRequest) {
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../../convex/_generated/api");

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const integration: any = await convex.query(api.quickbooks.getIntegration, {
      tenantId,
    });
    if (!integration?.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found. Please reconnect QuickBooks." },
        { status: 400 }
      );
    }

    const OAuthClient = (await import("intuit-oauth")).default;
    const oauthClient = new OAuthClient({
      clientId: process.env.QB_CLIENT_ID!,
      clientSecret: process.env.QB_CLIENT_SECRET!,
      environment: process.env.QB_ENVIRONMENT || "sandbox",
      redirectUri: process.env.QB_REDIRECT_URI!,
    });

    oauthClient.setToken({ refresh_token: integration.refreshToken });
    await oauthClient.refresh();
    const token = oauthClient.getToken();

    await convex.mutation(api.quickbooks.updateTokens, {
      integrationId: integration._id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[QB Refresh]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
