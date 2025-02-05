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
            }
        })
        return sendResponse(res, 201, true, "Habit created successfully", { habit })
    } catch (error) {
        return handleError(res, error)
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
        return handleError(res, error)
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
        handleError(res, error)
    }
}

export const getHabit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return sendResponse(res, 401, false, "Unauthorized")
        }
        const id = req.query.id as string;
        const habit = await prisma.habit.findFirst({
            where: {
                id,
                userId
            },
            select: {
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
        handleError(res, error)
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
        handleError(res, error)
    }
}