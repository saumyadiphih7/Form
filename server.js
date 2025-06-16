import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/dbConfig.js";
import userRouter from "./route/user.route.js";

dotenv.config();

const app = express();

//connect to database
connectDB();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/", (req, res) => {
  res.send("Server is running seccessfully");
});

app.use("/api/user", userRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is connected at port ${port}`);
});
