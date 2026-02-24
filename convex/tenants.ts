import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create Tenant ────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    userId: v.string(),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check slug uniqueness
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error(`Slug "${args.slug}" is already taken.`);

    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      plan: args.plan ?? "starter",
      createdAt: Date.now(),
    });

    // Make the creator the owner
    await ctx.db.insert("tenantUsers", {
      tenantId,
      userId: args.userId,
      role: "owner",
      invitedAt: Date.now(),
      joinedAt: Date.now(),
    });

    return tenantId;
  },
});

// ─── Get Tenant by Slug ───────────────────────────────────────────────────────

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getById = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tenantId);
  },
});

// ─── Get Tenants for a User ───────────────────────────────────────────────────

export const getForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("tenantUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const tenants = await Promise.all(
      memberships.map((m) => ctx.db.get(m.tenantId))
    );
    return tenants.filter(Boolean);
  },
});

// ─── Invite User ──────────────────────────────────────────────────────────────

export const inviteUser = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenantUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    if (existing.some((e) => e.tenantId === args.tenantId)) {
      throw new Error("User is already a member of this tenant.");
    }

    return await ctx.db.insert("tenantUsers", {
      tenantId: args.tenantId,
      userId: args.userId,
      role: args.role,
      invitedAt: Date.now(),
    });
  },
});

// ─── Seed Demo Tenant ─────────────────────────────────────────────────────────

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "revolve-mtg"))
      .first();
    if (existing) return { tenantId: existing._id, seeded: false };

    const tenantId = await ctx.db.insert("tenants", {
      name: "Revolve Mortgage",
      slug: "revolve-mtg",
      plan: "pro",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tenantUsers", {
      tenantId,
      userId: "demo-user",
      role: "owner",
      invitedAt: Date.now(),
      joinedAt: Date.now(),
    });

    return { tenantId, seeded: true };
  },
});
