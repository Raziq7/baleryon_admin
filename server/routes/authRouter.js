import express from "express";
import { loginController } from "../controller/authController.js";

var router = express.Router();


router.route("/login").post(loginController);

export default router;