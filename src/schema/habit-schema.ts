import { z } from "zod"

export const habitSchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    description: z.string().optional(),
    icon: z.string().optional().default("activity"),
    color: z.string().optional().default("#f16a2b")
})

export const reorderHabitSchema = z.array(z.object(
    {
        id: z.string(),
        position: z.number().int().nonnegative()
    })
)