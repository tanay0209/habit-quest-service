import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../lib/auth-request";
import { sendResponse } from "../lib/api-response";
import { handleError } from "../lib/handle-error";

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return sendResponse(res, 401, false, "Unauthorized")
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        return handleError(res, error)
    }
}