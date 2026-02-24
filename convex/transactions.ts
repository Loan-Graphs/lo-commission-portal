import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    loanType: v.optional(v.string()),
    lender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db.query("transactions").collect();

    if (args.startDate) {
      transactions = transactions.filter((t) => t.date >= args.startDate!);
    }
    if (args.endDate) {
      transactions = transactions.filter((t) => t.date <= args.endDate!);
    }
    if (args.loanType && args.loanType !== "all") {
      transactions = transactions.filter((t) => t.loanType === args.loanType);
    }
    if (args.lender && args.lender !== "all") {
      transactions = transactions.filter((t) => t.lender === args.lender);
    }

    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    const currentYear = now.getFullYear().toString();

    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(currentMonth)
    );
    const yearTransactions = transactions.filter((t) =>
      t.date.startsWith(currentYear)
    );

    const currentMonthTotal = monthTransactions.reduce(
      (sum, t) => sum + t.netCommission,
      0
    );
    const ytdTotal = yearTransactions.reduce(
      (sum, t) => sum + t.netCommission,
      0
    );

    // Breakdown by loan type
    const byLoanType: Record<string, number> = {};
    yearTransactions.forEach((t) => {
      byLoanType[t.loanType] = (byLoanType[t.loanType] || 0) + t.netCommission;
    });

    const totalFeeDeductions = yearTransactions.reduce(
      (sum, t) => sum + t.feeDeductions,
      0
    );
    const totalSplits = yearTransactions.reduce(
      (sum, t) => sum + t.splits,
      0
    );

    return {
      currentMonthTotal,
      ytdTotal,
      byLoanType,
      totalFeeDeductions,
      totalSplits,
      transactionCount: yearTransactions.length,
    };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("transactions").collect();
    if (existing.length > 0) return { seeded: false };

    const mockData = [
      {
        date: "2026-02-15",
        borrowerLastFourSSN: "4521",
        loanAmount: 425000,
        loanType: "conventional",
        lender: "United Wholesale Mortgage",
        commissionRate: 1.5,
        grossCommission: 6375,
        feeDeductions: 500,
        splits: 637.5,
        netCommission: 5237.5,
        status: "paid",
        closingDate: "2026-02-15",
      },
      {
        date: "2026-02-08",
        borrowerLastFourSSN: "7832",
        loanAmount: 320000,
        loanType: "FHA",
        lender: "Rocket Mortgage",
        commissionRate: 1.5,
        grossCommission: 4800,
        feeDeductions: 400,
        splits: 480,
        netCommission: 3920,
        status: "paid",
        closingDate: "2026-02-08",
      },
      {
        date: "2026-01-28",
        borrowerLastFourSSN: "3301",
        loanAmount: 550000,
        loanType: "jumbo",
        lender: "Chase",
        commissionRate: 1.25,
        grossCommission: 6875,
        feeDeductions: 600,
        splits: 687.5,
        netCommission: 5587.5,
        status: "paid",
        closingDate: "2026-01-28",
      },
      {
        date: "2026-01-20",
        borrowerLastFourSSN: "9104",
        loanAmount: 285000,
        loanType: "VA",
        lender: "Veterans United",
        commissionRate: 1.5,
        grossCommission: 4275,
        feeDeductions: 300,
        splits: 427.5,
        netCommission: 3547.5,
        status: "paid",
        closingDate: "2026-01-20",
      },
      {
        date: "2026-01-12",
        borrowerLastFourSSN: "6677",
        loanAmount: 198000,
        loanType: "USDA",
        lender: "Guaranteed Rate",
        commissionRate: 1.5,
        grossCommission: 2970,
        feeDeductions: 250,
        splits: 297,
        netCommission: 2423,
        status: "paid",
        closingDate: "2026-01-12",
      },
      {
        date: "2025-12-30",
        borrowerLastFourSSN: "2288",
        loanAmount: 375000,
        loanType: "conventional",
        lender: "United Wholesale Mortgage",
        commissionRate: 1.5,
        grossCommission: 5625,
        feeDeductions: 450,
        splits: 562.5,
        netCommission: 4612.5,
        status: "paid",
        closingDate: "2025-12-30",
      },
      {
        date: "2025-12-15",
        borrowerLastFourSSN: "5543",
        loanAmount: 410000,
        loanType: "conventional",
        lender: "Rocket Mortgage",
        commissionRate: 1.5,
        grossCommission: 6150,
        feeDeductions: 500,
        splits: 615,
        netCommission: 5035,
        status: "paid",
        closingDate: "2025-12-15",
      },
      {
        date: "2025-11-22",
        borrowerLastFourSSN: "8891",
        loanAmount: 290000,
        loanType: "FHA",
        lender: "loanDepot",
        commissionRate: 1.5,
        grossCommission: 4350,
        feeDeductions: 400,
        splits: 435,
        netCommission: 3515,
        status: "paid",
        closingDate: "2025-11-22",
      },
    ];

    for (const tx of mockData) {
      await ctx.db.insert("transactions", tx);
    }
    return { seeded: true, count: mockData.length };
  },
});
