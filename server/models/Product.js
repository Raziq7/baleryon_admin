import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number },
    category: { type: Object, required: true },
    note: { type: String },
    sizes: [
      {
        size: { type: String, required: true },
        quantity: { type: Number, required: true }
      }
    ],
    file: { type: String },
    color: { type: String },
    productDetails: { type: String },
    isReturn: { type: Boolean },
    image: { type: Object, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ productName: 1, category: 1 });

export default mongoose.model("Product", productSchema);
