import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

        orderId: {
            type: String,
            required: true,
            unique: true, // Ensure each order ID is unique
        },
        amount: {
            type: Number,
            required: true, // The amount of the order in paise (cents)
        },
        currency: {
            type: String,
            required: true, // Currency type (e.g., INR)
            default: 'INR', // Default to INR if not provided
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address', // Reference to the Address model
            required: true, // Every order should have an address
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending', // Set to 'pending' initially
        },
        receipt: {
            type: String,
            required: true, // Unique receipt ID
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        isDelivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        deliveryStatus: {
            type: String,
            enum: ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
            default: 'Order Placed', // Set to 'pending' initially
        },

        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product model
                size: { type: String, required: true },  // Store selected size
                color: { type: String, required: true }, // Store selected color
                quantity: { type: Number, required: true, default: 1 }, // Store quantity
                price: { type: Number, required: true }, // Store product price at the time of order
            },
        ],
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt
    }
);

export const Order = mongoose.model('Order', orderSchema);
