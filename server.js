import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/dbConfig.js";
import userRouter from "./route/user.route.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";


dotenv.config();

const app = express();

//connect to database
connectDB();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//routes
app.get("/", (req, res) => {
  res.send("Server is running seccessfully");
});



app.use("/api/user", userRouter);


// swaggger
// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Form API Docs",
      version: "1.0.0",
      description: "Form API Documentation",
    },
    servers: [
      {
        url: "http://localhost:5000", // Your API base URL
      },
    ],
  },
  apis: [path.join(__dirname, "./swagger.yaml")], // Path to Swagger/OpenAPI file
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsdoc(swaggerOptions);
// Swagger UI setup
app.use('/api/user/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//add route if not found
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is connected at port ${port}`);
});
