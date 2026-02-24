import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("loans").collect();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("loans").collect();
    if (existing.length > 0) return { seeded: false };

    const stages = ["Application", "Processing", "Underwriting", "Closing"];
    const mockLoans = [
      {
        borrowerName: "Michael Johnson",
        borrowerLastFourSSN: "1234",
        loanAmount: 450000,
        loanType: "conventional",
        lender: "United Wholesale Mortgage",
        stage: "Closing",
        applicationDate: "2026-01-15",
        expectedClosingDate: "2026-03-01",
        projectedCommission: 6000,
        interestRate: 6.875,
      },
      {
        borrowerName: "Sarah Williams",
        borrowerLastFourSSN: "5678",
        loanAmount: 310000,
        loanType: "FHA",
        lender: "Rocket Mortgage",
        stage: "Underwriting",
        applicationDate: "2026-01-28",
        expectedClosingDate: "2026-03-10",
        projectedCommission: 4200,
        interestRate: 7.125,
      },
      {
        borrowerName: "David Martinez",
        borrowerLastFourSSN: "9012",
        loanAmount: 625000,
        loanType: "jumbo",
        lender: "Chase",
        stage: "Processing",
        applicationDate: "2026-02-05",
        expectedClosingDate: "2026-03-20",
        projectedCommission: 7800,
        interestRate: 7.25,
      },
      {
        borrowerName: "Jennifer Lee",
        borrowerLastFourSSN: "3456",
        loanAmount: 275000,
        loanType: "VA",
        lender: "Veterans United",
        stage: "Application",
        applicationDate: "2026-02-12",
        expectedClosingDate: "2026-04-01",
        projectedCommission: 3750,
        interestRate: 6.5,
      },
      {
        borrowerName: "Robert Chen",
        borrowerLastFourSSN: "7890",
        loanAmount: 395000,
        loanType: "conventional",
        lender: "Guaranteed Rate",
        stage: "Underwriting",
        applicationDate: "2026-02-01",
        expectedClosingDate: "2026-03-15",
        projectedCommission: 5200,
        interestRate: 6.99,
      },
      {
        borrowerName: "Amanda Thompson",
        borrowerLastFourSSN: "2345",
        loanAmount: 185000,
        loanType: "USDA",
        lender: "Guaranteed Rate",
        stage: "Processing",
        applicationDate: "2026-02-10",
        expectedClosingDate: "2026-03-25",
        projectedCommission: 2600,
        interestRate: 6.75,
      },
    ];

    for (const loan of mockLoans) {
      await ctx.db.insert("loans", loan);
    }
    return { seeded: true, count: mockLoans.length };
  },
});
