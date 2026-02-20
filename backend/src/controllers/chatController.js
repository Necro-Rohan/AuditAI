import { generateCacheKey, checkCache } from '../services/cacheService.js';
import { calculateNPS } from '../services/aggregationService.js';
import ChatHistory from '../models/ChatHistory.model.js';

export const handleChatQuery = async (req, res) => {
  // Start performance timer immediately to capture total execution time including auth and RBAC checks
  const requestStart = Date.now();
  
  try {
    const { query, domain, category } = req.body;
    const user = req.freshUser; 

    if (!query || !domain || !category) {
      return res.status(400).json({ error: "Missing required fields(query, domain, category)." });
    }

    // Normalization before anything touches the DB or Cache so that we have a consistent format for keys and RBAC checks
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    const lowerQuery = query.trim().toLowerCase();

    // Generating cache key
    const cacheKey = generateCacheKey(lowerQuery, normalizedDomain, normalizedCategory, user);
    
    // Cache Check
    const cachedResponse = await checkCache(cacheKey);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse.finalResponse);
    }

    let responsePayload = {};
    let intent = 'unknown';
    let auditData = { mongoAggregationTimeMs: 0, aggregationPipeline: [], filtersApplied: {} };

    // Intent Routing 
    if (lowerQuery.includes('nps') || lowerQuery.includes('trend')) {
      intent = 'chart';
      
      const { data, pipeline, executionTimeMs, rbacMatch } = await calculateNPS(normalizedDomain, normalizedCategory, user);
      
      responsePayload = {
        type: 'chart',
        title: `NPS Trend for ${category}`, // Using original casing for display
        data: data
      };

      auditData = {
        mongoAggregationTimeMs: executionTimeMs,
        aggregationPipeline: pipeline,
        filtersApplied: rbacMatch
      };

    } else if (lowerQuery.includes('summary') || lowerQuery.includes('why')) {
      return res.status(501).json({ message: "LLM Summarization coming in next step." });
    } else {
      intent = 'unknown';
      responsePayload = { error: "Query not recognized. Try asking for NPS trends or summaries." };
    }

    // Calculate total execution time
    const totalResponseTimeMs = Date.now() - requestStart;

    // Audit Log (Always runs, even for unknown intents)
    await ChatHistory.create({
      userId: user._id,
      role: user.role,
      query: lowerQuery,
      intent,
      domainAtTime: normalizedDomain,
      categoryAtTime: normalizedCategory,
      aggregationPipeline: auditData.aggregationPipeline,
      filtersApplied: auditData.filtersApplied,
      responseType: intent === 'unknown' ? 'error' : intent,
      finalResponse: responsePayload,
      cacheKey: cacheKey,
      metrics: {
        mongoAggregationTimeMs: auditData.mongoAggregationTimeMs,
        totalResponseTimeMs: totalResponseTimeMs,
        cacheHit: false
      }
    });

    if (intent === 'unknown') {
      return res.status(400).json(responsePayload);
    }

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error during query processing." });
  }
};