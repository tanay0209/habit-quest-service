import { Router } from "express";
import { archiveHabit, createHabit, deleteHabit, getArchivedHabits, getHabit, getUserHabits, toggleHabitCompletion, unarchiveHabit, updateHabit } from "../controllers/habit.controller";

const habitRouter = Router()

habitRouter.post("/v1/create", createHabit)
habitRouter.post("/v1/reorder",)

habitRouter.put("/v1/update/:id", updateHabit)
habitRouter.put("/v1/archive/:id", archiveHabit)
habitRouter.put("/v1/toggle-completion/:id", toggleHabitCompletion)

habitRouter.get("/v1/get", getUserHabits)
habitRouter.get("/v1/get-habit/:id", getHabit)
habitRouter.get("/v1/get-archived", getArchivedHabits)
habitRouter.get("/v1/unarchive/:id", unarchiveHabit)

habitRouter.delete("/v1/delete/:id", deleteHabit)


export default habitRouter