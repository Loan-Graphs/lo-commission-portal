import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../../convex/_generated/api");

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const { tenantId, userId } = await req.json();

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: "tenantId and userId are required" },
        { status: 400 }
      );
    }

    const result = await convex.action(api.plaid.createLinkToken, {
      tenantId,
      userId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Plaid create-link-token]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
