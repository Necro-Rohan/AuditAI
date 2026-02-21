import { generateCacheKey, checkCache } from '../services/cacheService.js';
import { calculateNPS } from '../services/aggregationService.js';
import ChatHistory from '../models/ChatHistory.model.js';
import { generateReviewSummary } from '../services/llmService.js';
import { classifyIntent } from '../utils/intentClassifier.js';

export const getScopedChatHistory = async (req, res) => {
  try {
    const user = req.freshUser;
    const { domain, category } = req.query;

    if (!domain || !category) {
      return res.status(400).json({ error: "Domain and category required." });
    }

    const THIRTY_MINUTES = 30 * 60 * 1000;
    const timeThreshold = new Date(Date.now() - THIRTY_MINUTES);

    const history = await ChatHistory.find({
      userId: user._id,
      domainAtTime: domain.toLowerCase(),
      categoryAtTime: category.toLowerCase(),
      createdAt: { $gte: timeThreshold }
    })
      .sort({ createdAt: 1 })
      .limit(6)
      .lean();

    return res.status(200).json(history);
  } catch (err) {
    console.error("History fetch error:", err);
    return res.status(500).json({ error: "Failed to load history." });
  }
};

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

    const THIRTY_MINUTES = 30 * 60 * 1000;
    const timeThreshold = new Date(Date.now() - THIRTY_MINUTES);
    
    const recentHistory = await ChatHistory.find({
      userId: user._id,
      domainAtTime: normalizedDomain,
      categoryAtTime: normalizedCategory,
      createdAt: { $gte: timeThreshold }
    }).sort({ createdAt: 1 }).limit(10).lean();

    // Structured JSON Memory Builder ---
    const buildStructuredMemory = (history) => {
      if (!history || history.length === 0) return null;

      const memory = {
        lastIntent: null,
        lastChart: null,
        lastSummary: null,
        previousCharts: []
      };

      
      const lastEntry = history[history.length - 1];

      if (lastEntry) {
        memory.lastIntent = lastEntry.responseType;

        if (lastEntry.responseType === "chart") {
          memory.lastChart = {
            title: lastEntry.finalResponse?.title,
            dataPoints: lastEntry.finalResponse?.data?.length || 0
          };
        }

        if (lastEntry.responseType === "summary") {
          const summaryText = typeof lastEntry.llmResponse === 'string' ? lastEntry.llmResponse 
                          : typeof lastEntry.finalResponse?.data === 'string' ? lastEntry.finalResponse.data 
                          : "";
          memory.lastSummary = {
            title: lastEntry.finalResponse?.title,
            // Optimized: Prevent token bloat by slicing to 500 and removing excess whitespace
            excerpt: summaryText.slice(0, 500).replace(/\s+/g, " "),
          };
        }
      }

      memory.previousCharts = history
        .filter(h => h.responseType === "chart")
        .map(h => ({
          title: h.finalResponse?.title,
          query: h.query
        }))
        .slice(-3);

      return memory;
    };

    const structuredMemory = buildStructuredMemory(recentHistory);

    // --- Intent Routing ---
    let responsePayload = {};
    let intent = 'unknown';
    let auditData = { mongoAggregationTimeMs: 0, aggregationPipeline: [], filtersApplied: {} };
    let intentInherited = false;

    let detectedIntent = classifyIntent(lowerQuery);

    const wordCount = lowerQuery.split(/\s+/).filter(w => w.length > 0).length;
    const isVagueQuery = wordCount <= 5;

    if (detectedIntent === "unknown" && structuredMemory?.lastIntent && isVagueQuery) {
      detectedIntent = structuredMemory.lastIntent;
      intentInherited = true;
    }

    switch (detectedIntent) {
      case "chart":
        intent = "chart";
        const { data, pipeline, executionTimeMs, rbacMatch } = await calculateNPS(normalizedDomain, normalizedCategory, user);
        
        responsePayload = {
          type: "chart",
          title: `NPS Trend for ${category}`,
          data: data
        };

        auditData = { mongoAggregationTimeMs: executionTimeMs, aggregationPipeline: pipeline, filtersApplied: rbacMatch };
        break;

      case "summary":
      case "advisory":
        intent = "summary";
        
        // Pass the structured JSON memory to the LLM
        const llmResult = await generateReviewSummary(query, normalizedDomain, normalizedCategory, user, structuredMemory);
        
        responsePayload = {
          type: "summary",
          title: detectedIntent === "advisory" ? "Strategic Recommendation" : `AI Analysis: ${category}`,
          data: llmResult.summary,
        };

        auditData = {
          mongoAggregationTimeMs: llmResult.mongoTimeMs,
          llmLatencyMs: llmResult.llmLatencyMs,
          llmPrompt: llmResult.prompt,
          selectedReviewIds: llmResult.reviewIds,
          quotesExtracted: llmResult.quotesExtracted,
          filtersApplied: llmResult.rbacMatch,
        };
        break;

      default:
        intent = "unknown";
        // Reverted to "error" to maintain strict frontend contract consistency
        responsePayload = {
          type: "error", 
          title: "Unsupported Query",
          data: "Try asking for NPS trends, feedback summaries, or improvement suggestions.",
        };
    }

    let finalCacheKey = cacheKey;
    if (intent === "unknown") {
      finalCacheKey = null; // Don't cache unsupported queries
    } else if (
      intent === "summary" && (!auditData.llmLatencyMs || auditData.llmLatencyMs === 0)
    ) {
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