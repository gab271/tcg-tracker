import { z } from "zod";

export const cardPriceQuerySchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  game: z.enum(["pokemon", "magic"] as const, {
    error: 'Game must be "pokemon" or "magic"',
  }),
});

export type CardPriceQuery = z.infer<typeof cardPriceQuerySchema>;
