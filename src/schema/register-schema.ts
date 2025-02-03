import { z } from "zod"

export const registerSchema = z.object({
    email: z.string().email("Invalid email"),
    username: z.string().min(1, "Username is required").max(20, "Username cannot exceed 20 characters"),
    password: z.string().min(8, "Password must be atleast 8 characters")
})