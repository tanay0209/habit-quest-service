import { z } from "zod"

export const habitSchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    description: z.string().optional(),
    emoji: z.string().optional().default("activity"),
    color: z.string().optional().default("#f16a2b")
})