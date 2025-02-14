import { AuthRequest } from "../lib/auth-request";
import { Response } from "express";
import { handleError } from "../lib/handle-error";
import { categorySchema } from "../schema/category-schema";
import { sendResponse } from "../lib/api-response";
import prisma from "../lib/prisma";

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
        const user = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                categoryCount: true,
                categoryMax: true
            }
        })
        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }
        if (user.categoryCount === user.categoryMax) {
            return sendResponse(res, 401, false, "Exhausted category limit")
        }
        const validated = categorySchema.safeParse(req.body)
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message)
        }
        const { title, icon } = validated.data
        const category = await prisma.category.create({
            data: {
                userId,
                name: title,
                icon,
            },
            select: {
                userId: true,
                name: true,
                icon: true
            }
        })
        return sendResponse(res, 201, true, "Category Created", { category })
    } catch (error) {
        handleError(res, error, "Create Category")
    }
}