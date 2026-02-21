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

  // Priority 1: Advisory / Strategy
  if (advisoryKeywords.some((word) => q.includes(word))) return "advisory";

  // Priority 2: Summary / Analysis
  if (summaryKeywords.some((word) => q.includes(word))) return "summary";

  // Priority 3: Chart / Data
  if (chartKeywords.some((word) => q.includes(word)) || (q.includes("nps") && chartKeywords.some(word => q.includes(word)))) {
    return "chart";
  }

  return "unknown";
};