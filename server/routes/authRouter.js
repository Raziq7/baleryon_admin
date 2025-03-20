import express from "express";
import { authController, loginController } from "../controller/authController.js";

var router = express.Router();

router.route("/register").post(authController);

router.route("/login").post(loginController);

export default router;