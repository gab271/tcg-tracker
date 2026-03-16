import { z } from "zod";

export const updateDisplayNameSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(50, "Name too long").trim(),
});

export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => ALLOWED_IMAGE_TYPES.includes(f.type), "Only JPEG, PNG, and WebP images are allowed")
    .refine((f) => f.size <= MAX_AVATAR_SIZE, "File must be smaller than 5MB"),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
