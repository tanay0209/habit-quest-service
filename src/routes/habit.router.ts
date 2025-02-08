import { Router } from "express";
import { archiveHabit, createHabit, deleteHabit, getArchivedHabits, getHabit, getUserHabits, unarchiveHabit, updateHabit } from "../controllers/habit.controller";

const habitRouter = Router()

habitRouter.post("/v1/create-habit", createHabit)
habitRouter.post("/v1/reorder-habits",)

habitRouter.put("/v1/update-habit/:id", updateHabit)

habitRouter.get("/v1/get-habits", getUserHabits)
habitRouter.get("/v1/get-habit/:id", getHabit)
habitRouter.get("/v1/get-archived-habits", getArchivedHabits)
habitRouter.get("/v1/unarchive-habit/:id", unarchiveHabit)
habitRouter.get("/v1/archive-habit/:id", archiveHabit)

habitRouter.delete("/v1/delete-habit/:id", deleteHabit)


export default habitRouter