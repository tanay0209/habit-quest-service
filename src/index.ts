import express from "express";
import authRouter from "./routes/auth.router";
import habitRouter from "./routes/habit.router";
import { isAuthenticated } from "./middleware/is-authenticated";
import categoryRouter from "./routes/category.router";
import cors from "cors"
const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(express.json())
app.use(cors({
    origin: ["*"],
    methods: ["*"],
    credentials: true
}))

app.use("/auth", authRouter)
app.use("/habit", isAuthenticated, habitRouter)
app.use("/category", isAuthenticated, categoryRouter)

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running:", PORT);
})