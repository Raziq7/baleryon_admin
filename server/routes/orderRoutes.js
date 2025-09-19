import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createOrderController,
  getOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  deleteOrderController,
} from "../controller/orderController.js";

const router = express.Router();

/**
 * Admin/lead protected endpoints (adjust as per your roles):
 */

// Create (optional — only if you need admin-side creation)
router.route("/createOrder").post(protect, createOrderController);

// List w/ pagination + filters
router.route("/getOrders").get(protect, getOrdersController);

// Detail
router.route("/orderDetails").get(protect, getOrderByIdController);

// Update status / flags
router.route("/updateStatus/:id").put(protect, updateOrderStatusController);

// Delete (hard delete by default; see controller comment for soft-delete alt)
router.route("/deleteOrder/:id").delete(protect, deleteOrderController);

export default router;
