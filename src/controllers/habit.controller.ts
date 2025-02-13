import { Response } from "express";
import { AuthRequest } from "../lib/auth-request";
import { handleError } from "../lib/handle-error";
import prisma from "../lib/prisma";
import { habitSchema, reorderHabitSchema } from "../schema/habit-schema";
import { sendResponse } from "../lib/api-response";


export const createHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!;

        const validated = habitSchema.safeParse(req.body);
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message);
        }

        const { title, description, icon, color, categories } = validated.data;

        const user = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                habitCount: true,
                maxHabit: true
            }
        })

        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }

        if (user.habitCount === user.maxHabit) {
            return sendResponse(res, 403, false, "Reached max habit limit, buy more to create new habit")
        }
        let categoryLinks: { categoryId: string }[] = [];

        if (categories && categories.length > 0) {
            const existingCategories = await prisma.category.findMany({
                where: {
                    id: { in: categories },
                    userId,
                },
                select: { id: true },
            });

            const existingCategoryIds = existingCategories.map((cat) => cat.id);
            const invalidCategories = categories.filter((id) => !existingCategoryIds.includes(id));

            if (invalidCategories.length > 0) {
                return sendResponse(res, 400, false, `Invalid categories: ${invalidCategories.join(", ")}`);
            }

            categoryLinks = existingCategoryIds.map((categoryId) => ({
                categoryId,
            }));
        }

        const habit = await prisma.habit.create({
            data: {
                userId,
                title,
                description,
                icon,
                color,
                position: user.habitCount + 1,
                habitCategories: {
                    create: categoryLinks,
                },
            },
            select: {
                id: true,
                title: true,
                description: true,
                color: true,
                icon: true,
                habitCategories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                habitCount: { increment: 1 }
            }
        })
        return sendResponse(res, 201, true, "Habit created successfully", {
            habit
        });
    } catch (error) {
        return handleError(res, error, "Create Habit");
    }
};

export const getUserHabits = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!

        const habits = await prisma.habit.findMany({
            where: {
                userId,
                isActive: true
            },
            orderBy: {
                position: "asc"
            },
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                color: true,
                streakBest: true,
                streakCurrent: true,
                habitlogs: {
                    select: {
                        completed: true,
                        date: true
                    }
                },
                category: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        })
        return sendResponse(res, 200, true, "Habits fetched successfully", { habits: habits || [] })
    } catch (error) {
        return handleError(res, error, "User Habits")
    }
}

export const archiveHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!

        const habitId = req.params.id
        const habit = await prisma.habit.findFirst({
            where: {
                id: habitId,
                userId
            }
        })

        if (!habit) {
            return sendResponse(res, 404, false, "Habit not found")
        }

        await prisma.habit.update({
            where: {
                id: habit.id
            },
            data: {
                isActive: false
            }
        })
        return sendResponse(res, 200, true, "Habit archived successfully")
    } catch (error) {
        handleError(res, error, "Archive Habits")
    }
}

export const getHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const id = req.params.id;
        const habit = await prisma.habit.findFirst({
            where: {
                id,
                userId
            },
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                color: true,
                streakBest: true,
                streakCurrent: true,
                habitlogs: {
                    select: {
                        date: true,
                        completed: true
                    }
                }
            }
        })
        if (!habit) {
            return sendResponse(res, 404, false, "Habit not found")
        }
        return sendResponse(res, 200, true, "Habit fetched", { habit })
    } catch (error) {
        handleError(res, error, "Fetch Habit")
    }
}

export const updateHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            sendResponse(res, 401, false, "Unauthorized")
        }

        const validated = habitSchema.safeParse(req.body)
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message)
        }
        const id = req.params.id as string
        const { title, description, icon, color, } = validated.data
        const habit = await prisma.habit.update({
            where: {
                id
            },
            data: {
                title,
                description,
                icon,
                color
            }
        })

        if (!habit) {
            return sendResponse(res, 404, false, "Habit not found")
        }

        return sendResponse(res, 200, true, "Habit updated successfully")
    } catch (error) {
        handleError(res, error, "Update Habit")
    }
}

export const getArchivedHabits = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const habit = await prisma.habit.findMany({
            where: {
                userId,
                isActive: false
            },
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                color: true
            }
        })
        return sendResponse(res, 200, true, "Habit archived successfully", { habit: habit.length ? habit : [] })
    } catch (error) {
        handleError(res, error, "Archived Habits")
    }
}

export const unarchiveHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const habitId = req.params.id
        const habit = await prisma.habit.findFirst({
            where: {
                id: habitId,
                userId,
                isActive: false
            }
        })

        if (!habit) {
            return sendResponse(res, 404, false, "Habit not found")
        }

        await prisma.habit.update({
            where: {
                id: habit.id
            },
            data: {
                isActive: true
            }
        })
        return sendResponse(res, 200, true, "Habit archived successfully")
    } catch (error) {
        return handleError(res, error, "Unarchive Habit")
    }
}

export const deleteHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const habitId = req.params.id

        const habit = await prisma.habit.delete({
            where: {
                id: habitId,
                userId,
                isActive: false
            }
        })
        if (!habit) {
            return sendResponse(res, 404, false, "Habit not found")
        }
        return sendResponse(res, 200, true, "Habit deleted")
    } catch (error) {
        return handleError(res, error, "Delete Habit")
    }
}

export const reorderHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const validated = reorderHabitSchema.safeParse(req.body)
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message)
        }
        const habits = validated.data
        const updatedPositions = habits.map((habit) => {
            prisma.habit.update({
                where: { id: habit.id, userId },
                data: { position: habit.position }
            })
        })

        await Promise.all(updatedPositions)
        return sendResponse(res, 200, true, "Habits reordered")
    } catch (error) {
        return handleError(res, error, "Reorder Habit")
    }
}