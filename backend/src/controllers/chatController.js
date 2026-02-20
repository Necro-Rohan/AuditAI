import { generateCacheKey, checkCache } from '../services/cacheService.js';
import { calculateNPS } from '../services/aggregationService.js';
import ChatHistory from '../models/ChatHistory.model.js';
import { generateReviewSummary } from '../services/llmService.js';

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
      const totalResponseTimeMs = Date.now() - requestStart;

      await ChatHistory.create({
        userId: user._id,
        role: user.role,
        query: lowerQuery,
        intent: cachedResponse.intent,
        domainAtTime: normalizedDomain,
        categoryAtTime: normalizedCategory,
        responseType: cachedResponse.responseType,
        finalResponse: cachedResponse.finalResponse,
        cacheKey: cacheKey,
        metrics: {
          totalResponseTimeMs: totalResponseTimeMs,
          mongoAggregationTimeMs: 0,
          llmLatencyMs: 0,
          cacheHit: true // TRUE because it was found in cache
        }
      });

      return res.status(200).json(cachedResponse.finalResponse);
    }

    let responsePayload = {};
    let intent = 'unknown';
    let auditData = { mongoAggregationTimeMs: 0, aggregationPipeline: [], filtersApplied: {} };

    // Intent Routing 
    if (
      (lowerQuery.includes('nps') || lowerQuery.includes('trend') || lowerQuery.includes('trends'))&&
      !lowerQuery.includes('summary') && !lowerQuery.includes('why') && !lowerQuery.includes('reason')) {
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

    } else if (
      lowerQuery.includes('summary') ||
      lowerQuery.includes('why') ||
      lowerQuery.includes('reason') ||
      lowerQuery.includes('improve') ||  
      lowerQuery.includes('feedback') || 
      lowerQuery.includes('suggestion') ||
      lowerQuery.includes('recommendation') ||
      lowerQuery.includes('insight') ||
      lowerQuery.includes('analysis')
    ){
      intent = "summary";

      const llmResult = await generateReviewSummary(
        query,
        normalizedDomain,
        normalizedCategory,
        user,
      );

      responsePayload = {
        type: "summary",
        title: `AI Analysis: ${category}`,
        data: llmResult.summary,
      };

      auditData = {
        mongoAggregationTimeMs: llmResult.mongoTimeMs,
        llmLatencyMs: llmResult.llmLatencyMs,
        llmPrompt: llmResult.prompt,
        selectedReviewIds: llmResult.reviewIds,
        quotesExtracted: llmResult.quotesExtracted,
        filtersApplied: llmResult.rbacMatch, // Using exact match from service
      };

    } else {
      intent = 'unknown';
      responsePayload = { error: "Query not recognized. Try asking for NPS trends or summaries." };
    }

    let finalCacheKey = cacheKey;
    if (intent === "unknown") {
      finalCacheKey = null; // Never cache errors
    } else if (intent === "summary" && (!auditData.llmLatencyMs || auditData.llmLatencyMs === 0))
    {
      finalCacheKey = null; // Not caching a failed AI run
    }

    // total execution time
    const totalResponseTimeMs = Date.now() - requestStart;

    // Audit Log (Always runs, even for unknown intents)
    await ChatHistory.create({
      userId: user._id,
      role: user.role,
      query: lowerQuery,
      intent,
      domainAtTime: normalizedDomain,
      categoryAtTime: normalizedCategory,
      aggregationPipeline: auditData.aggregationPipeline || [],
      filtersApplied: auditData.filtersApplied,
      quotesExtracted: auditData.quotesExtracted || [],
      llmPrompt: auditData.llmPrompt,
      llmResponse: intent === "summary" ? responsePayload.data : undefined,
      selectedReviewIds: auditData.selectedReviewIds || [],
      responseType: intent === "unknown" ? "error" : intent,
      finalResponse: responsePayload,
      cacheKey: finalCacheKey, // Will be null if AI failed!
      metrics: {
        totalResponseTimeMs: totalResponseTimeMs,
        mongoAggregationTimeMs: auditData.mongoAggregationTimeMs,
        llmLatencyMs: auditData.llmLatencyMs || 0,
        cacheHit: false,
      },
    });

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error during query processing." });
  }
};