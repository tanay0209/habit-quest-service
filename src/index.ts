import express from "express";
import authRouter from "./routes/auth.router";
import habitRouter from "./routes/habit.router";

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use("/auth", authRouter)
app.use("/habit", habitRouter)

app.listen(PORT, () => {
    console.log("Server running:", PORT);
})