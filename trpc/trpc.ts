import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { usePrisma } from "../utils/prisma";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const appRouter = t.router({
  animeById: publicProcedure.input(z.number().int()).query(async (opts) => {
    const { input } = opts;
    return await usePrisma.anime.findFirst({ where: { id: input } });
  }),
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(12342);
