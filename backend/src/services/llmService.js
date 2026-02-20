import { GoogleGenAI } from "@google/genai";
import Review from "../models/Review.model.js";
import dotenv from "dotenv";

dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

export const generateReviewSummary = async (query, domain, category, user) => {
  let rbacMatch = {
    review_text: { $exists: true, $ne: "" },
  };

  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();
  const isAllDomains = normalizedDomain === "all";
  const isAllCategories = normalizedCategory === "all";
  const lowerQuery = query.toLowerCase();

  // RBAC LOGIC
  if (user.role === "Admin") {
    if (!isAllDomains) rbacMatch.domain = normalizedDomain;
    if (!isAllCategories) rbacMatch.categories = { $in: [normalizedCategory] };
  } else {
    if (isAllDomains) {
      rbacMatch.domain = {
        $in: user.assignedDomains.map((d) => d.toLowerCase()),
      };
    } else {
      rbacMatch.domain = normalizedDomain;
    }

    if (isAllCategories) {
      rbacMatch.categories = {
        $in: user.assignedCategories.map((c) => c.toLowerCase()),
      };
    } else {
      rbacMatch.categories = { $in: [normalizedCategory] };
    }
  }

  // SENTIMENT FILTERING
  if (
    lowerQuery.includes("unhappy") ||
    lowerQuery.includes("worst") ||
    lowerQuery.includes("bad")
  ) {
    rbacMatch.rating = { $lte: 6 };
  } else if (
    lowerQuery.includes("happy") ||
    lowerQuery.includes("best") ||
    lowerQuery.includes("good")
  ) {
    rbacMatch.rating = { $gte: 9 };
  }

  //AGGREGATION PIPELINE
  const startTime = Date.now();
  const pipeline = [
    { $match: rbacMatch },
    {
      $project: {
        rating: 1,
        review_title: 1,
        review_text: 1,
        review_id: 1,
        textLen: { $strLenCP: "$review_text" },
      },
    },
    { $sort: { textLen: -1 } },
    { $limit: 10 },
  ];

  const topDetailedReviews = await Review.aggregate(pipeline);
  const mongoTimeMs = Date.now() - startTime;

  if (topDetailedReviews.length === 0) {
    return {
      summary:
        "I couldn't find any detailed written reviews matching this criteria.",
      llmLatencyMs: 0,
      mongoTimeMs,
      prompt: "N/A",
      reviewIds: [],
      success: true, // Considered a successful run, just no data
    };
  }

  //DETERMINISTIC SAMPLING (Longest, Median, Shortest of the top 10)
  const selectedReviews = [];
  if (topDetailedReviews.length > 0) {
    selectedReviews.push(topDetailedReviews[0]); // Longest
  }
  if (topDetailedReviews.length > 2) {
    selectedReviews.push(
      topDetailedReviews[Math.floor(topDetailedReviews.length / 2)],
    ); // Median
  }
  if (topDetailedReviews.length > 1) {
    selectedReviews.push(topDetailedReviews[topDetailedReviews.length - 1]); // Shortest
  }

  // Deduplicate in case array length was very small
  const uniqueSelectedReviews = [...new Set(selectedReviews)];

  const reviewContext = uniqueSelectedReviews
    .map((r) => {
      const trimmedText =
        r.review_text.length > 400
          ? r.review_text.substring(0, 400) + "..."
          : r.review_text;
      return `[Rating: ${r.rating}/10] Title: ${r.review_title} | Review: ${trimmedText}`;
    })
    .join("\n\n");

  const reviewIds = uniqueSelectedReviews.map((r) => r.review_id);

  // AI PROMPT
  const prompt = `
    You are an expert enterprise data analyst. Answer the user's query strictly based on the provided customer review excerpts.
    
    User Query: "${query}"
    Context: ${category}
    
    Instructions:
    - Identify the specific reasons for the ratings based ONLY on these quotes.
    - Do not hallucinate or add external knowledge.
    - Format in clean Markdown (bullet points).
    - Keep it concise and professional.

    Extracted Review Quotes:
    ${reviewContext}
  `;

  //RESILIENT AI INVOCATION (Retry Pattern)
  let responseText = "";
  let llmLatencyMs = 0;
  let success = false;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const llmStartTime = Date.now();
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      responseText = result.text;
      llmLatencyMs = Date.now() - llmStartTime;
      success = true;
      break; 
    } catch (error) {
      console.warn(`Gemini API attempt ${attempt} failed:`, error.message);
      if (attempt === 2) {
        responseText =
          "AI summarization is temporarily unavailable due to a network or service error. Please try again later.";
        success = false;
      }
    }
  }

  const extractedQuotes = uniqueSelectedReviews.map((r) => {
    return r.review_text.length > 400
      ? r.review_text.substring(0, 400) + "..."
      : r.review_text;
  });

  return {
    summary: responseText,
    llmLatencyMs,
    mongoTimeMs,
    prompt,
    reviewIds,
    quotesExtracted: extractedQuotes,
    success,
    rbacMatch,
  };
};
