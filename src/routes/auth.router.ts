import { Router } from "express";
import { generateNewRefreshToken, getUserDetails, googleSignIn, loginUser, registerUser } from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/is-authenticated";

const authRouter = Router()

authRouter.post("/v1/register-user", registerUser)
authRouter.post("/v1/login", loginUser)
authRouter.post("/v1/google-sign-in", googleSignIn)
authRouter.post("/v1/refresh-token", generateNewRefreshToken)
authRouter.get("/v1/get-user-details", isAuthenticated, getUserDetails)


export default authRouter