import { Response } from "express"
export const handleError = (res: Response, error: unknown, controller: string) => {
    console.error(controller, error)
    return res.status(500).json({
        message: "Internal Server Error"
    }) as any
}