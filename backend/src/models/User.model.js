import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // Will be hashed via bcrypt
  role: { 
    type: String, 
    enum: ['Admin', 'Analyst'], 
    required: true 
  },
  assignedDomains: [{ type: String, lowercase: true, trim: true }],
  assignedCategories: [{ type: String, lowercase: true, trim: true }],
  isActive: { type: Boolean, default: true } // Soft delete rule
}, { timestamps: true });

export default mongoose.model('User', userSchema);