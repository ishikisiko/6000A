import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { HttpError } from "@shared/_core/errors";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    console.log("[Context] Cookies:", opts.req.headers.cookie);
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Context] Auth success, user:", user?.id, "openId:", user?.openId);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 403) {
      // Expected error when user is not logged in
      // console.log("[Context] User not authenticated");
    } else {
      console.log("[Context] Auth failed:", error);
    }
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
