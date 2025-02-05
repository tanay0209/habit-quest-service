import { Router } from "express";
import { isAuthenticated } from "../middleware/is-authenticated";
import { archiveHabit, createHabit, getHabit, getUserHabits, updateHabit } from "../controllers/habit.controller";

const habitRouter = Router()

habitRouter.post("/v1/create-habit", createHabit)

habitRouter.put("/v1/update-habit/:id", isAuthenticated, updateHabit)

habitRouter.get("/v1/get-habits", isAuthenticated, getUserHabits)
habitRouter.get("/v1/get-habit/:id", isAuthenticated, getHabit)

habitRouter.delete("/v1/archive-habit/:id", isAuthenticated, archiveHabit)

export default habitRouter