export const classifyIntent = (query) => {
  const q = query.toLowerCase().trim();

  const advisoryKeywords = [
    "how", "increase", "improve", "recommend", 
    "suggest", "advice", "strategy", "what should", "how can"
  ];

  const summaryKeywords = [
    "summary", "why", "reason", "feedback", 
    "insight", "analysis", "complaint"
  ];

  const chartKeywords = [
    "trend", "trends", "show", "plot", "graph", "chart"
  ];

  const hasKeyword = (keywords) => {
    return keywords.some((word) => new RegExp(`\\b${word}\\b`, "i").test(q));
  };

  // Priority 1: Advisory / Strategic Recommendations
  if (hasKeyword(advisoryKeywords)) return "advisory";

  // Priority 2: Summary / Analysis
  if (hasKeyword(summaryKeywords)) return "summary";

  // Priority 3: Chart / Data
  if (hasKeyword(chartKeywords) || (/\bnps\b/i.test(q) && /\bshow\b/i.test(q))) {
    return "chart";
  }

  return "unknown";
};