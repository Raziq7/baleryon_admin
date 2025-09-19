import asyncHandler from "express-async-handler";
import { Order } from "../models/Order.js";
import Address from "../models/Address.js";
// import Product from "../models/Product.js"; // only used for optional existence checks

/**
 * @desc    Create an order (admin-side, optional)
 * @route   POST /api/admin/order/createOrder
 * @access  Protected
 */
// controller/orderController.js

export const createOrderController = asyncHandler(async (req, res) => {
  const body = JSON.parse(JSON.stringify(req.body));
  const {
    userId,
    amount,
    currency = "INR",
    receipt,
    items,
    orderId,
    addressId,                // pass this if address already exists
    addressPayload,           // OR pass this to create Address inline
    paymentStatus = "pending"
  } = body;

  if (!userId || !receipt || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing userId, receipt or items[]" });
  }

  // Validate amount
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  // Resolve address id (create if payload given)
  let address;
  if (addressId) {
    address = addressId;
  } else if (addressPayload) {
    // validate basic fields based on your Address schema
    const { name, street, city, state, zip, number } = addressPayload;
    if (!name || !street || !city || !state || !zip || !number) {
      return res.status(400).json({ message: "Incomplete addressPayload" });
    }
    const created = await Address.create({ userId, ...addressPayload });
    address = created._id;
  } else {
    return res.status(400).json({ message: "Provide addressId or addressPayload" });
  }

  const genOrderId =
    orderId && String(orderId).trim()
      ? String(orderId).trim()
      : `ORD-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const createdOrder = await Order.create({
    userId,
    orderId: genOrderId,
    amount: numAmount,
    currency,
    address,
    paymentStatus: ["pending", "paid", "failed"].includes(paymentStatus)
      ? paymentStatus
      : "pending",
    isPaid: paymentStatus === "paid",
    isDelivered: false,
    deliveredAt: undefined,
    deliveryStatus: "Order Placed",
    receipt,
    items: items.map((it) => ({
      productId: it.productId,
      size: it.size,
      color: it.color,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price),
    })),
  });

  res.status(201).json({ message: "Order created", order: createdOrder });
});


/**
 * @desc    Get orders (paginated, filterable)
 * @route   GET /api/admin/order/getOrders
 * @access  Protected
 *
 * Query params:
 *   page, limit
 *   q (search in orderId)
 *   paymentStatus (pending|paid|failed)
 *   deliveryStatus (Order Placed|Processing|Shipped|Out for Delivery|Delivered)
 *   isPaid (true|false)
 *   isDelivered (true|false)
 *   from,to (ISO date strings) -> filter by createdAt
 *   populate (boolean: "true") -> populate address and items.productId
 */
export const getOrdersController = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    q,
    paymentStatus,
    deliveryStatus,
    isPaid,
    isDelivered,
    from,
    to,
    populate,
  } = req.query;

  const filter = {};

  if (q) {
    filter.orderId = { $regex: String(q).trim(), $options: "i" };
  }
  if (paymentStatus && ["pending", "paid", "failed"].includes(paymentStatus)) {
    filter.paymentStatus = paymentStatus;
  }
  const DELIVERY_STATES = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  if (deliveryStatus && DELIVERY_STATES.includes(deliveryStatus)) {
    filter.deliveryStatus = deliveryStatus;
  }
  if (typeof isPaid !== "undefined") {
    filter.isPaid = String(isPaid) === "true";
  }
  if (typeof isDelivered !== "undefined") {
    filter.isDelivered = String(isDelivered) === "true";
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  let query = Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (String(populate) === "true") {
    query = query.populate("address").populate({
      path: "items.productId",
      select: "productName image", // customize fields
    });
  }

  const [orders, total] = await Promise.all([
    query.exec(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    orders,
    pageNo: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total,
  });
});

/**
 * @desc    Get order details by id
 * @route   GET /api/admin/order/orderDetails?id=:id
 * @access  Protected
 * Query: ?id=ORDER_DOCUMENT_ID
 * Optional: ?populate=true
 */
export const getOrderByIdController = asyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing required query param id." });

  const order = await Order.findById(id)
    .populate({ path: "userId", select: "firstName lastName email phone" })
    .populate({ path: "address" }) // works if model is registered as "Address"
    .populate({ path: "items.productId", select: "productName image" })
    .exec();

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.status(200).json({ order });
});


/**
 * @desc    Update order status flags
 * @route   PUT /api/admin/order/updateStatus/:id
 * @access  Protected
 * Body: any subset of { paymentStatus, isPaid, deliveryStatus, isDelivered, deliveredAt }
 */
export const updateOrderStatusController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Missing order id" });

  // Accept only whitelisted fields
  const { paymentStatus, isPaid, deliveryStatus, isDelivered, deliveredAt } =
    JSON.parse(JSON.stringify(req.body));

  const update = {};

  // Payment status consistency
  if (typeof paymentStatus !== "undefined") {
    if (!["pending", "paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus" });
    }
    update.paymentStatus = paymentStatus;
    // auto-derive isPaid when paymentStatus provided
    update.isPaid = paymentStatus === "paid";
  }

  if (typeof isPaid !== "undefined") {
    update.isPaid = Boolean(isPaid);
    if (typeof paymentStatus === "undefined") {
      update.paymentStatus = update.isPaid ? "paid" : "pending";
    }
  }

  // Delivery status consistency
  const DELIVERY_STATES = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  if (typeof deliveryStatus !== "undefined") {
    if (!DELIVERY_STATES.includes(deliveryStatus)) {
      return res.status(400).json({ message: "Invalid deliveryStatus" });
    }
    update.deliveryStatus = deliveryStatus;

    if (deliveryStatus === "Delivered") {
      update.isDelivered = true;
      update.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();
    } else {
      update.isDelivered = false;
      update.deliveredAt = undefined;
    }
  }

  if (typeof isDelivered !== "undefined") {
    update.isDelivered = Boolean(isDelivered);

    if (typeof deliveryStatus === "undefined") {
      // If caller toggled isDelivered without giving deliveryStatus,
      // we set a sensible default.
      update.deliveryStatus = update.isDelivered ? "Delivered" : "Processing";
    }

    if (update.isDelivered) {
      update.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();
    } else {
      update.deliveredAt = undefined;
    }
  }

  if (typeof deliveredAt !== "undefined" && update.isDelivered) {
    update.deliveredAt = new Date(deliveredAt);
  }

  const updated = await Order.findByIdAndUpdate(id, update, { new: true });
  if (!updated) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.status(200).json({
    message: "Order status updated",
    order: updated,
  });
});

/**
 * @desc    Delete order
 * @route   DELETE /api/admin/order/deleteOrder/:id
 * @access  Protected
 *
 * NOTE: This is a hard delete. If you prefer *soft delete*, add `isActive`
 * to the schema and set it false instead of deleting.
 */
export const deleteOrderController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Missing order id" });

  const deleted = await Order.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.status(200).json({ message: "Order deleted successfully" });
});
