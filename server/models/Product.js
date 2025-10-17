import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const sizeSchema = new Schema(
  {
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    productName: { type: String, required: true },
    description: { type: String, required: true },

    // prices
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    purchasePrice: { type: Number, required: true },

    // relations
    category: { type: Types.ObjectId, ref: "Category", required: true },           // level 1
    subcategory: { type: Types.ObjectId, ref: "Category", default: null },         // level 2 (optional)
    subSubcategory: { type: Types.ObjectId, ref: "Category", default: null },      // level 3 (optional)

    // misc
    note: { type: String, default: "" },
    sizes: { type: [sizeSchema], required: true },
    color: { type: String, default: "" },
    colors: { type: [String], default: [] }, // hex strings, optional
    productDetails: { type: String, default: "" },
    isReturn: { type: Boolean, default: true },

    image: { type: [String], required: true }, // S3 URLs
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ productName: 1, category: 1 });

export default mongoose.model("Product", productSchema);
