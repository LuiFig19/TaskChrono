import { auth } from "@/lib/better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { ensureBetterAuthSchema } from "@/lib/dbMigrations";

const handler = toNextJsHandler(auth.handler);

export async function GET(request: Request, ctx: any) {
  await ensureBetterAuthSchema();
  // @ts-ignore
  return handler.GET(request, ctx);
}

export async function POST(request: Request, ctx: any) {
  await ensureBetterAuthSchema();
  // @ts-ignore
  return handler.POST(request, ctx);
}
