import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";



import connect from "./connect/connect.js"
import { errorHandler, notFound } from "./middlewares/errorMiddlware.js";
import productRouter from "./routes/productRouter.js";
import userManagmentRouter from "./routes/userManagmentRouter.js"
import authRouter from "./routes/authRouter.js";
import settingRouter from "./routes/settingRouter.js";

import sanitizedConfig from "./config.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT"],
}));


// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




// db Connectig
connect().then(() => console.log("DB connected"));


app.use("/api/auth/", authRouter);
app.use("/api/admin/product/", productRouter);

// user managment router
app.use("/api/admin/userManagment/", userManagmentRouter);

// setting
app.use("/api/admin/setting/", settingRouter);


app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use(notFound);
app.use(errorHandler);

const PORT = sanitizedConfig.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));