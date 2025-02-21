import { z } from "zod"

export const categorySchema = z.object({
    name: z.string().min(1, "Title cannot be empty"),
    icon: z.string().optional().default("activity"),
})