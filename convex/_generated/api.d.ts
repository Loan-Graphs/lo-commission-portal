/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as lenders from "../lenders.js";
import type * as loans from "../loans.js";
import type * as plaid from "../plaid.js";
import type * as puzzle from "../puzzle.js";
import type * as quickbooks from "../quickbooks.js";
import type * as tenants from "../tenants.js";
import type * as transactions from "../transactions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  lenders: typeof lenders;
  loans: typeof loans;
  plaid: typeof plaid;
  puzzle: typeof puzzle;
  quickbooks: typeof quickbooks;
  tenants: typeof tenants;
  transactions: typeof transactions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
