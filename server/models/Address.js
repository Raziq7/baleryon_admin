// models/Address.js
import mongoose from 'mongoose';

const addressSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
  },
  zip: {
    type: String,
    required: [true, 'Zip code is required'],
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
  },
}, {
  timestamps: true, // This will add createdAt and updatedAt fields automatically
});

export default mongoose.model("Address", addressSchema, "addresses");
