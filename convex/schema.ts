import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    date: v.string(),
    borrowerLastFourSSN: v.string(),
    loanAmount: v.number(),
    loanType: v.string(), // "conventional", "FHA", "VA", "USDA", "jumbo"
    lender: v.string(),
    commissionRate: v.number(), // percentage e.g. 1.5
    grossCommission: v.number(),
    feeDeductions: v.number(),
    splits: v.number(), // split with broker/team
    netCommission: v.number(),
    status: v.string(), // "paid", "pending"
    closingDate: v.string(),
  }),

  loans: defineTable({
    borrowerName: v.string(),
    borrowerLastFourSSN: v.string(),
    loanAmount: v.number(),
    loanType: v.string(),
    lender: v.string(),
    stage: v.string(), // "Application", "Processing", "Underwriting", "Closing"
    applicationDate: v.string(),
    expectedClosingDate: v.string(),
    projectedCommission: v.number(),
    interestRate: v.number(),
  }),

  lenders: defineTable({
    name: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    loanTypes: v.array(v.string()),
    commissionRates: v.object({
      conventional: v.optional(v.number()),
      FHA: v.optional(v.number()),
      VA: v.optional(v.number()),
      USDA: v.optional(v.number()),
      jumbo: v.optional(v.number()),
    }),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),
});
