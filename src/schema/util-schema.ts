import { z } from "zod"

export const usernameSchema = z.object({
    username: z.string().max(20, "Username cannot exceed 20 characters").min(1, "Username cannot be empty")
})