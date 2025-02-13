import { Router } from "express";
import { deleteAccount, generateNewRefreshToken, getUserDetails, googleSignIn, loginUser, logout, registerUser, updateUsername } from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/is-authenticated";

const authRouter = Router()

authRouter.post("/v1/register-user", registerUser)
authRouter.post("/v1/login", loginUser)
authRouter.post("/v1/google-sign-in", googleSignIn)
authRouter.post("/v1/refresh-token", generateNewRefreshToken)

authRouter.get("/v1/get-user-details", isAuthenticated, getUserDetails)
authRouter.get("/v1/logout", isAuthenticated, logout)

authRouter.delete("/v1/delete-account", isAuthenticated, deleteAccount)

authRouter.put("/v1/update-username", isAuthenticated, updateUsername)


export default authRouter