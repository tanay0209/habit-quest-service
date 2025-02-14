import express from "express";
import authRouter from "./routes/auth.router";
import habitRouter from "./routes/habit.router";
import { isAuthenticated } from "./middleware/is-authenticated";
import categoryRouter from "./routes/category.router";

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use("/auth", authRouter)
app.use("/habit", isAuthenticated, habitRouter)
app.use("/category", isAuthenticated, categoryRouter)

app.listen(PORT, () => {
    console.log("Server running:", PORT);
})