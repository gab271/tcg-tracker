import { z } from "zod";

export const createDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional().default(""),
  game: z.string().min(1, "Please select a game"),
  format: z.string().min(1, "Please select a format"),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export const updateDeckCardSchema = z.object({
  quantity: z.number().int().min(1).max(99),
  orderIndex: z.number().int().min(0),
});

export type UpdateDeckCardInput = z.infer<typeof updateDeckCardSchema>;
