import { Router } from "express";
import { archiveHabit, createHabit, getArchivedHabits, getHabit, getUserHabits, updateHabit } from "../controllers/habit.controller";

const habitRouter = Router()

habitRouter.post("/v1/create-habit", createHabit)

habitRouter.put("/v1/update-habit/:id", updateHabit)

habitRouter.get("/v1/get-habits", getUserHabits)
habitRouter.get("/v1/get-habit/:id", getHabit)
habitRouter.get("/v1/get-archived-habits", getArchivedHabits)

habitRouter.delete("/v1/archive-habit/:id", archiveHabit)

export default habitRouter