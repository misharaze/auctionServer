import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Некорректный email"),

    username: z
      .string()
      .min(3, "Минимум 3 символа")
      .max(24, "Максимум 24 символа")
      .regex(/^[a-zA-Z0-9_]+$/, "Только латиница, цифры и _"),

    password: z
      .string()
      .min(6, "Минимум 6 символов")
      .max(64, "Максимум 64 символа"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Некорректный email"),
    password: z.string().min(6).max(64),
  }),
});
