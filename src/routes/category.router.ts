import { createCategory, deleteCategory, userCategories } from './../controllers/category.controller';
import { Router } from "express";

const categoryRouter = Router()


categoryRouter.post("/v1/create", createCategory)

categoryRouter.get("/v1/fetch", userCategories)

categoryRouter.delete("/v1/delete/:id", deleteCategory)

export default categoryRouter