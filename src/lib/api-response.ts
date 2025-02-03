import { Response } from "express"
export const sendResponse = (
    res: Response,
    statusCode: number,
    success: boolean,
    message: string | any,
    data: any = null
) => {
    return res.status(statusCode).json({ success, message, ...(data && { data }) }) as any
}