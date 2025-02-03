import { Request, Response } from "express";
import { registerSchema } from "../schema/register-schema";
import prisma from "../lib/prisma";
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from "../lib/utils";
import { sendResponse } from "../lib/api-response";
import { handleError } from "../lib/handle-error";
import { loginSchema } from "../schema/login-schema";
import { OAuth2Client } from "google-auth-library";
import { AuthRequest } from "../lib/auth-request";
import jwt from "jsonwebtoken"

export const registerUser = async (req: Request, res: Response) => {
    try {
        const validation = registerSchema.safeParse(req.body)
        if (!validation.success) {
            return sendResponse(res, 400, false, validation.error.errors[0].message)
        }
        const { email, username, password } = validation.data
        const exisitingUsername = await prisma.user.findFirst({
            where: {
                username
            }
        })
        if (exisitingUsername) {
            return sendResponse(res, 400, false, "Username already exists")
        }
        const exisitingEmail = await prisma.user.findFirst({
            where: {
                email
            }
        })
        if (exisitingEmail) {
            return sendResponse(res, 400, false, "Email already exists")
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
        handleError(res, error)
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
        const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1d" })

        const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" })
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
        handleError(res, error)
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

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: email!,
                    googleId,
                    username: name!,
                },
            });
        }

        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        // Return the tokens
        return sendResponse(res, 201, true, "Login successful", { accessToken, refreshToken });
    } catch (error) {
        handleError(res, error);
    }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                username: true,
                email: true
            }
        })
        if (!user) {
            return sendResponse(res, 404, false, "User not found")
        }
        return sendResponse(res, 200, true, "User data fetched successfully", { user })
    } catch (error) {
        handleError(res, error)
    }
}

export const generateNewRefreshToken = async (req: AuthRequest, res: Response) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            sendResponse(res, 401, false, "No refresh token provided")
        }
        const user = await prisma.user.findFirst({
            where: {
                refreshToken
            }
        })

        if (!user) {
            sendResponse(res, 403, false, "Invalid refresh token")
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
        return sendResponse(res, 200, true, "Token refreshed", { accessToken, refreshToken })
    } catch (error) {
        handleError(res, error)
    }
}