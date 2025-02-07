import { Response } from "express";
import { AuthRequest } from "../lib/auth-request";
import { handleError } from "../lib/handle-error";
import prisma from "../lib/prisma";
import { habitSchema } from "../schema/habit-schema";
import { sendResponse } from "../lib/api-response";


export const createHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const validated = habitSchema.safeParse(req.body)
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message)
        }
        const { title, description, emoji, color } = validated.data
        const habit = await prisma.habit.create({
            data: {
                userId: userId!,
                title,
                description,
                emoji,
                color
            },
            select: {
                id: true,
                title: true,
                description: true,
                emoji: true,
                color: true
            }
        })

        return sendResponse(res, 201, true, "Habit created successfully", { habit })
    } catch (error) {
        return handleError(res, error, "Create Habit")
    }
}

export const getUserHabits = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const habits = await prisma.habit.findMany({
            where: {
                userId,
                isActive: true
            },
            select: {
                id: true,
                title: true,
                description: true,
                emoji: true,
                color: true,
                habitlogs: {
                    select: {
                        completed: true,
                        date: true
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
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
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
                emoji: true,
                color: true,
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
        const { title, description, emoji, color, } = validated.data
        const habit = await prisma.habit.update({
            where: {
                id
            },
            data: {
                title,
                description,
                emoji,
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
                emoji: true,
                color: true
            }
        })
        return sendResponse(res, 200, true, "Habit archived successfully", { habit: habit.length ? habit : [] })
    } catch (error) {
        handleError(res, error, "Archived Habits")
    }
}