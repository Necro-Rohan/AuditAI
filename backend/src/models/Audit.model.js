import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: String, required: true }, 
  userRole: { type: String, required: true },
  attemptedCategory: { type: String },
  attemptedDomain: { type: String },
  type: { type: String, required: true }, // e.g., 'unauthorized_access_attempt'
  ipAddress: { type: String }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);