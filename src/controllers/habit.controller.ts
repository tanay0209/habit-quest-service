import e, { Response } from "express";
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
                streakBest: true,
                streakCurrent: true,
                habitlogs: {
                    select: {
                        date: true,
                        completed: true
                    }
                },
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
                habitCategories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                icon: true,
                            }
                        }
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
        const userId = req.user?.id!;
        const id = req.params.id;

        const validated = habitSchema.safeParse(req.body);
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message);
        }

        const { title, description, icon, color, categories } = validated.data;

        const existingHabit = await prisma.habit.findUnique({
            where: { id, userId },
            select: { id: true },
        });

        if (!existingHabit) {
            return sendResponse(res, 404, false, "Habit not found");
        }

        const updatedHabit = await prisma.habit.update({
            where: { id },
            data: {
                title,
                description,
                icon,
                color,
                habitCategories: categories
                    ? {
                        deleteMany: {},
                        create: categories.map((categoryId) => ({
                            category: { connect: { id: categoryId } },
                        })),
                    }
                    : undefined,
            },
        });

        return sendResponse(res, 200, true, "Habit updated successfully");
    } catch (error) {
        handleError(res, error, "Update Habit");
    }
};

export const getArchivedHabits = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
        const habits = await prisma.habit.findMany({
            where: {
                userId,
                isActive: false
            },
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                color: true,
                habitCategories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
            }
        })
        return sendResponse(res, 200, true, "Fetched archived habits", { habits: habits.length ? habits : [] })
    } catch (error) {
        handleError(res, error, "Archive Habits")
    }
}

export const unarchiveHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
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

export const reorderHabits = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
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

export const toggleHabitCompletion = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!;
        const habitId = req.params.id;

        const today = new Date();
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const existingLog = await prisma.habitLog.findFirst({
            where: {
                habitId,
                date: dateOnly,
            },
        });

        if (existingLog) {
            await prisma.$transaction([
                prisma.habitLog.delete({
                    where: {
                        id: existingLog.id,
                    },
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        coins: {
                            decrement: 1,
                        },
                    },
                }),
            ]);

            return sendResponse(res, 200, true, "Marked incomplete");
        }

        await prisma.$transaction([
            prisma.habitLog.create({
                data: {
                    habitId,
                    date: dateOnly,
                    completed: true,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    coins: {
                        increment: 1,
                    },
                },
            }),
        ]);

        return sendResponse(res, 200, true, "Marked completed");
    } catch (error) {
        return handleError(res, error, "Toggle habit completion");
    }
};

