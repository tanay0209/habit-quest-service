import { Response } from "express"
export const handleError = (res: Response, error: unknown) => {
    console.error("Register User", error)
    return res.status(500).json({
        message: "Internal Server Error"
    }) as any
}