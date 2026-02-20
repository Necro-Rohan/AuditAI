import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  review_id: { type: Number, required: true, unique: true },
  review_date: { type: Date },
  rating: { type: Number, required: true },
  review_title: { type: String },
  review_text: { type: String },
  year: { type: Number },
  month: { type: Number },
  domain: { type: String, required: true, lowercase: true, trim: true },
  entity_name: { type: String, required: true },
  category: { type: String, required: true, lowercase: true, trim: true },
});

// Indexes for fast RBAC filtering and Aggregation
reviewSchema.index({ domain: 1, category: 1 });
reviewSchema.index({ domain: 1, entity_name: 1 });
reviewSchema.index({ domain: 1, category: 1, year: 1 });

export default mongoose.model("Review", reviewSchema, "review");
