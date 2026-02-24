import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quickbooks/callback
 * QuickBooks OAuth callback — exchanges the auth code for tokens and
 * stores them in accountingIntegrations via Convex.
 */
export async function GET(req: NextRequest) {
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../../convex/_generated/api");

    const url = req.url;
    const { searchParams } = new URL(url);
    const tenantId = searchParams.get("state");
    const realmId = searchParams.get("realmId");

    if (!tenantId) {
      return NextResponse.json({ error: "Missing state (tenantId)" }, { status: 400 });
    }

    const OAuthClient = (await import("intuit-oauth")).default;
    const oauthClient = new OAuthClient({
      clientId: process.env.QB_CLIENT_ID!,
      clientSecret: process.env.QB_CLIENT_SECRET!,
      environment: process.env.QB_ENVIRONMENT || "sandbox",
      redirectUri: process.env.QB_REDIRECT_URI!,
    });

    // Exchange authorization code for tokens
    await oauthClient.createToken(url);
    const token = oauthClient.getToken();

    // Store tokens in Convex
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    await convex.mutation(api.quickbooks.storeIntegration, {
      tenantId: tenantId as any,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      realmId: realmId || token.realmId || "",
      tokenExpiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    });

    // Redirect back to integrations page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?qb=connected&tenant=${tenantId}`
    );
  } catch (err: any) {
    console.error("[QB Callback]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
