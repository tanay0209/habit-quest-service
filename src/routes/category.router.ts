import { createCategory } from './../controllers/category.controller';
import { Router } from "express";

const categoryRouter = Router()


categoryRouter.post("/v1/create-habit", createCategory)

export default categoryRouter