/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminCourse from "../adminCourse.js";
import type * as adminMembers from "../adminMembers.js";
import type * as auth from "../auth.js";
import type * as bunny from "../bunny.js";
import type * as community from "../community.js";
import type * as course from "../course.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as learn from "../learn.js";
import type * as market from "../market.js";
import type * as payments from "../payments.js";
import type * as plans from "../plans.js";
import type * as screener from "../screener.js";
import type * as screenerSec from "../screenerSec.js";
import type * as telegram from "../telegram.js";
import type * as users from "../users.js";
import type * as watchlist from "../watchlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminCourse: typeof adminCourse;
  adminMembers: typeof adminMembers;
  auth: typeof auth;
  bunny: typeof bunny;
  community: typeof community;
  course: typeof course;
  crons: typeof crons;
  http: typeof http;
  learn: typeof learn;
  market: typeof market;
  payments: typeof payments;
  plans: typeof plans;
  screener: typeof screener;
  screenerSec: typeof screenerSec;
  telegram: typeof telegram;
  users: typeof users;
  watchlist: typeof watchlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
