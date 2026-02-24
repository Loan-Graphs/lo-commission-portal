import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../../convex/_generated/api");

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const { tenantId, publicToken } = await req.json();

    if (!tenantId || !publicToken) {
      return NextResponse.json(
        { error: "tenantId and publicToken are required" },
        { status: 400 }
      );
    }

    const result = await convex.action(api.plaid.exchangePublicToken, {
      tenantId,
      publicToken,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Plaid exchange-token]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
