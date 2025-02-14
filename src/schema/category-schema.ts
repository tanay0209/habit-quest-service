import { z } from "zod"

export const categorySchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    icon: z.string().optional().default("activity"),
})