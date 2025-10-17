// models/Category.js
import mongoose from "mongoose";
import slugify from "slugify";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // For URLs and fast lookups
    slug: { type: String, required: true, unique: true, lowercase: true },
    // Parent = null → root category (e.g., "Clothing", "Home Decor")
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    // Soft delete
    isActive: { type: Boolean, default: true },
    // Optional metadata (you can store icons, sort order, etc.)
    meta: {
      icon: { type: String },
      sort: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });
CategorySchema.index({ slug: 1 });

CategorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Category", CategorySchema);
