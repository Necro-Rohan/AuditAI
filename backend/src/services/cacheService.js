import crypto from 'crypto';
import ChatHistory from '../models/ChatHistory.model.js';

export const generateCacheKey = (query, domain, category, user) => {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Sorting to ensure array order doesn't generate different hashes
  const sortedCategories = [...user.assignedCategories].sort();
  const sortedDomains = [...user.assignedDomains].sort();

  const rawString = JSON.stringify({
    query: normalizedQuery,
    domain,
    category,
    userId: user._id, 
    role: user.role,
    assignedCategories: sortedCategories,
    assignedDomains: sortedDomains
  });

  return crypto.createHash('sha256').update(rawString).digest('hex');
};

export const checkCache = async (cacheKey) => {
  return await ChatHistory.findOne({ cacheKey });
};