import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  
  // Request Context
  query: { type: String, required: true },
  intent: { type: String, enum: ['chart', 'summary', 'list', 'unknown'], required: true },
  domainAtTime: { type: String, required: true },
  categoryAtTime: { type: String, required: true },
  
  // Admin Debug Data
  filtersApplied: { type: mongoose.Schema.Types.Mixed }, // The exact RBAC match conditions
  aggregationPipeline: [{ type: mongoose.Schema.Types.Mixed }], // The exact Mongo math used
  selectedReviewIds: [{ type: Number }], // Which reviews were sent to Gemini
  quotesExtracted: [{ type: String }], // The exact extracted substrings
  
  // AI Traceability
  llmPrompt: { type: String }, // Exact prompt string + injected quotes
  llmResponse: { type: String }, // Raw Gemini output
  
  // Final Delivered Payload
  responseType: { type: String, enum: ['chart', 'summary', 'error'] },
  finalResponse: { type: mongoose.Schema.Types.Mixed }, // What the frontend actually renders
  
  // Caching
  cacheKey: { type: String, index: true }, // SHA-256 Hash for instant lookups
  
  // Performance Metrics (For Admin Dashboard)
  metrics: {
    totalResponseTimeMs: { type: Number },
    mongoAggregationTimeMs: { type: Number },
    llmLatencyMs: { type: Number },
    cacheHit: { type: Boolean, default: false }
  }
}, { timestamps: true }); 

export default mongoose.model('ChatHistory', chatHistorySchema);