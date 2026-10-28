import { z } from "zod";

export const Team = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  wins: z.number().int().nullable(),
  image: z.string().url(),
  record: z.unknown().nullable(),
  outcome: z.string().nullable(),
});

export const Match = z.object({
  id: z.string().regex(/^\d+$/),
  block: z.string(),
  stage: z.enum(["Play-Ins", "Swiss", "Knockouts"]),
  state: z.enum(["scheduled", "live", "completed", "unverified"]).or(z.string()),
  bestOf: z.number().int().refine((n) => [1, 3, 5].includes(n)),
  startTime: z.string().datetime(),
  teams: z.array(Team).length(2),
  games: z.array(z.object({ n: z.number().int().positive(), id: z.string() }).passthrough()),
}).passthrough();

export const Snapshot = z.object({
  generatedAt: z.string().datetime(),
  matches: z.array(Match).min(1),
  teams: z.array(z.unknown()),
  sync: z.object({ lastSuccessAt: z.string().nullable() }).passthrough(),
}).passthrough();

export const Health = z.object({
  ok: z.literal(true),
  sync: z.object({ lastSuccessAt: z.string(), lastError: z.string().nullable(), connection: z.string(), storage: z.string() }).passthrough(),
});
