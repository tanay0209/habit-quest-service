import { z } from "zod"

export const loginSchema = z.object({
    userId: z.string().min(1, "Email or username is required"),
    password: z.string().min(1, "Password is required")
})