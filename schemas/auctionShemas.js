import { z } from "zod";

export const bidSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    amount: z.number().int().positive(),
  }),
});
