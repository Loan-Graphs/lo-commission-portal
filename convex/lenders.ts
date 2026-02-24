import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    search: v.optional(v.string()),
    loanType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let lenders = await ctx.db.query("lenders").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      lenders = lenders.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.contactName.toLowerCase().includes(s)
      );
    }
    if (args.loanType && args.loanType !== "all") {
      lenders = lenders.filter((l) => l.loanTypes.includes(args.loanType!));
    }

    return lenders;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("lenders").collect();
    if (existing.length > 0) return { seeded: false };

    const mockLenders = [
      {
        name: "United Wholesale Mortgage",
        contactName: "Tom Bradley",
        contactEmail: "tom.bradley@uwm.com",
        contactPhone: "(800) 981-8898",
        loanTypes: ["conventional", "FHA", "VA", "USDA", "jumbo"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5, USDA: 1.5, jumbo: 1.25 },
        website: "https://www.uwm.com",
        notes: "Top wholesale lender. Fast turn times on conventional.",
      },
      {
        name: "Rocket Mortgage",
        contactName: "Lisa Nguyen",
        contactEmail: "lisa.nguyen@rocketmortgage.com",
        contactPhone: "(800) 762-5837",
        loanTypes: ["conventional", "FHA", "VA", "jumbo"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5, jumbo: 1.0 },
        website: "https://www.rocketmortgage.com",
        notes: "Good for FHA. Strong tech platform.",
      },
      {
        name: "Chase",
        contactName: "Mark Wilson",
        contactEmail: "mark.wilson@chase.com",
        contactPhone: "(800) 432-3117",
        loanTypes: ["conventional", "jumbo"],
        commissionRates: { conventional: 1.25, jumbo: 1.0 },
        website: "https://www.chase.com/mortgage",
        notes: "Best jumbo rates in the market currently.",
      },
      {
        name: "Veterans United",
        contactName: "Chris Davis",
        contactEmail: "chris.davis@veteransunited.com",
        contactPhone: "(800) 884-1600",
        loanTypes: ["VA"],
        commissionRates: { VA: 1.5 },
        website: "https://www.veteransunited.com",
        notes: "VA specialists. Excellent for military borrowers.",
      },
      {
        name: "Guaranteed Rate",
        contactName: "Emily Carter",
        contactEmail: "emily.carter@rate.com",
        contactPhone: "(866) 934-7283",
        loanTypes: ["conventional", "FHA", "VA", "USDA", "jumbo"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5, USDA: 1.5, jumbo: 1.25 },
        website: "https://www.rate.com",
        notes: "Competitive on USDA. Good back-office support.",
      },
      {
        name: "loanDepot",
        contactName: "Kevin Park",
        contactEmail: "kevin.park@loandepot.com",
        contactPhone: "(888) 983-3240",
        loanTypes: ["conventional", "FHA", "VA", "jumbo"],
        commissionRates: { conventional: 1.5, FHA: 1.5, VA: 1.5, jumbo: 1.0 },
        website: "https://www.loandepot.com",
        notes: "Good for purchase loans. Fast appraisals.",
      },
    ];

    for (const lender of mockLenders) {
      await ctx.db.insert("lenders", lender);
    }
    return { seeded: true, count: mockLenders.length };
  },
});
