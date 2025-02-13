import { Request, Response } from "express";
import { registerSchema } from "../schema/register-schema";
import prisma from "../lib/prisma";
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from "../lib/utils";
import { sendResponse } from "../lib/api-response";
import { handleError } from "../lib/handle-error";
import { loginSchema } from "../schema/login-schema";
import { OAuth2Client } from "google-auth-library";
import { AuthRequest } from "../lib/auth-request";

export const registerUser = async (req: Request, res: Response) => {
    try {
        const validation = registerSchema.safeParse(req.body)
        if (!validation.success) {
            return sendResponse(res, 400, false, validation.error.errors[0].message)
        }
        const { email, username, password } = validation.data
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return sendResponse(res, 400, false, existingUser.username === username ? "Username already exists" : "Email already exists");
        }

        const hashedPassword = await hashPassword(password)
        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        })
        return sendResponse(res, 201, true, "User registered successfully")
    } catch (error) {
        return handleError(res, error, "Register User")
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const validation = loginSchema.safeParse(req.body)
        if (!validation.success) {
            return sendResponse(res, 400, false, validation.error.errors[0].message)
        }
        const { userId, password } = validation.data
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: userId },
                    { email: userId }
                ]
            }
        })
        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }
        const validPassword = await verifyPassword(password, user.password!)
        if (!validPassword) {
            return sendResponse(res, 401, false, "Invalid password")
        }
        const accessToken = generateAccessToken(user.id)

        const refreshToken = generateRefreshToken(user.id)
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken
            }
        })
        return sendResponse(res, 200, true, "Login successful", { accessToken, refreshToken })
    } catch (error) {
        return handleError(res, error, "Login User")
    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const googleSignIn = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return sendResponse(res, 400, false, "Token is required");
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return sendResponse(res, 400, false, "Invalid Google Token");
        }

        const { sub: googleId, email, name } = payload;

        let user = await prisma.user.findUnique({ where: { googleId } });
        let username = name!;
        let count = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
            username = `${name!}${count++}`;
        }

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: email!,
                    googleId,
                    username,
                },
            });
        }

        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        return sendResponse(res, 201, true, "Login successful", { accessToken, refreshToken });
    } catch (error) {
        return handleError(res, error, "Google Sign in");
    }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
                NOT: [{ refreshToken: null }]
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        })
        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }
        return sendResponse(res, 200, true, "User data fetched successfully", { user })
    } catch (error) {
        return handleError(res, error, "User details")
    }
}

export const generateNewRefreshToken = async (req: AuthRequest, res: Response) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            return sendResponse(res, 401, false, "No refresh token provided")
        }
        const user = await prisma.user.findFirst({
            where: {
                refreshToken
            }
        })

        if (!user) {
            return sendResponse(res, 403, false, "Invalid refresh token")
        }

        const accessToken = generateAccessToken(user?.id!)
        const newRefreshToken = generateRefreshToken(user?.id!)

        await prisma.user.update({
            where: {
                id: user?.id!
            },
            data: {
                refreshToken: newRefreshToken
            }
        })
        return sendResponse(res, 200, true, "Token refreshed", { accessToken, refreshToken: newRefreshToken })
    } catch (error) {
        return handleError(res, error, "Refresh Token")
    }
}

export const logout = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    try {
        await prisma.user.update({
            where: {
                id: userId
            }, data: {
                refreshToken: null
            }
        })
        return sendResponse(res, 200, true, "Logged out successfully")
    } catch (error) {
        return handleError(res, error, "Logout")
    }
}

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id

        const user = await prisma.user.delete({
            where: {
                id: userId
            }
        })
        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }
        return sendResponse(res, 200, true, "User deleted successfully")
    } catch (error) {
        return handleError(res, error, "Delete account")
    }
}