import { z } from "zod";

export const addCardSchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  name: z.string().min(1, "Card name is required"),
  image: z.string().url("Invalid image URL").optional(),
  game: z.string().min(1, "Game is required"),
  rarity: z.string().default("Common"),
  price: z.number().min(0, "Price cannot be negative").default(0),
  quantity: z.number().int().min(1).default(1),
});

export type AddCardInput = z.infer<typeof addCardSchema>;
