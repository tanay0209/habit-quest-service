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
        const { name, icon } = validated.data
        const category = await prisma.category.create({
            data: {
                userId,
                name,
                icon,
            },
            select: {
                id: true,
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

export const userCategories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
        const categories = await prisma.category.findMany({
            where:
            {
                userId: userId
            },
            select: {
                id: true,
                name: true,
                icon: true,
            }
        })
        return sendResponse(res, 200, true, "Categories fetched successfully", { categories })
    } catch (error) {
        handleError(res, error, "Fetch categories")
    }
}

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!

        const habitId = req.params.id

        const validated = categorySchema.safeParse(req.body)
        if (!validated.success) {
            return sendResponse(res, 400, false, validated.error.errors[0].message)
        }

        const { name, icon } = validated.data
        const category = await prisma.category.update({
            where: {
                id: habitId,
                userId
            },
            data: {
                name,
                icon
            }
        })
        if (!category) {
            return sendResponse(res, 404, false, "Category not found")
        }
        return sendResponse(res, 200, true, "Category updated")

    } catch (error) {
        handleError(res, error, "Update Category")
    }
}

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id!
        const categoryId = req.params.id

        const category = await prisma.category.findUnique({
            where: {
                id: categoryId,
                userId
            }
        })

        if (!category) {
            return sendResponse(res, 404, false, "Category not found")
        }
        return sendResponse(res, 200, true, "Category deleted")

    } catch (error) {
        handleError(res, error, "Delete Category")
    }
}
