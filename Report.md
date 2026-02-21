
# AuditAI Project Report

## 1. Approach & Problem Statement

In today's fast-paced digital landscape, enterprises receive an overwhelming volume of customer feedback across various domains and categories. Manually sifting through thousands of reviews to extract meaningful insights, identify trends, and calculate Net Promoter Scores (NPS) is not only incredibly time-consuming but also prone to human error and bias. Furthermore, organizations need strict data governance—ensuring that analysts only see the data they are authorized to access.

**The Problem:** How can an enterprise quickly analyze massive datasets of unstructured customer feedback, extract strategic insights, and visualize trends, all while strictly enforcing data privacy and role-based access control (RBAC)?

**The Approach:** Welcome to **AuditAI**, an intelligent, AI-powered analytics platform designed to bridge the gap between raw feedback and actionable strategy. Instead of complex dashboards with endless filters, AuditAI introduces a conversational interface. Users can simply ask questions like "What are the biggest complaints in the Banking sector this month?" and instantly receive AI-generated summaries backed by real user reviews, or ask for "NPS trends" to get dynamically generated charts. It's essentially a highly secure, enterprise-grade ChatGPT specifically tailored for your organization's customer feedback data.

---

## 2. Methodology & Architecture

AuditAI was built using a robust, modern tech stack designed for speed, security, and intelligence.

### Tech Stack
- **Frontend:** React (Vite), TailwindCSS, Recharts, React-Router
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **AI Integration:** Google Gemini (Generative AI)
- **Authentication:** JWT via HttpOnly cookies, bcryptjs

### Core Architecture & Workflow
1. **Intelligent Query Routing:** When a user asks a question, the backend employs a custom **Intent Classifier**. It analyzes the natural language query and determines if the user is looking for a mathematical trend (e.g., an NPS chart) or a qualitative analysis (e.g., a strategic summary or advisory).
2. **Strict RBAC & Data Scoping:** Before any database query is executed, the system checks the user's role (`Admin` or `Analyst`) and their assigned `domains` and `categories`. The MongoDB aggregation pipeline is dynamically injected with these `$match` rules, ensuring no data leakage occurs.
3. **Advanced LLM Integration:** For qualitative queries, AuditAI doesn't just send the raw question to the AI. It first performs a deterministic sampling of the most relevant reviews (fetching the longest, median, and shortest detailed reviews matching the criteria). It then constructs a highly specific prompt, injecting structured conversational memory so the AI remembers past interactions (like the last chart viewed).
4. **Performance & Caching:** To prevent hitting rate limits and reduce latency, the system utilizes a robust caching mechanism. The cache key is generated based on the query, domain, category, and user role, allowing instant retrievals for repeated questions.
5. **Auditing & Security:** Every unauthorized attempt to access out-of-scope data is strictly logged in an `Audit` collection, allowing administrators to monitor system security from a dedicated admin dashboard.

---

## 3. Findings, Challenges, & Outcomes

### Findings
During the development and testing of AuditAI, a few key insights emerged:
- **Context is King:** Passing raw data to an LLM without structured conversational memory led to disjointed interactions. Implementing a memory builder that tracks the user's "last intent" and "last chart" dramatically made the AI feel more intuitive and context-aware.
- **Speed Matters:** Doing heavy text aggregations on thousands of reviews can be slow. Implementing MongoDB indexes on `domain`, `category`, and `year`, combined with an intelligent caching layer, reduced wait times from several seconds to milliseconds for cached queries.

### Challenges Conquered
- **Hallucinations:** One of the biggest challenges with Generative AI is hallucination. AuditAI solves this by strictly providing the LLM with deterministic, pre-filtered review quotes from the database as context, explicitly instructing it to *not* formulate answers outside of the scope provided.
- **Balancing Security & Usability:** Enforcing strict RBAC usually results in a clunky user experience. By seamlessly integrating the RBAC filters directly into the MongoDB aggregation pipelines, the user simply chats naturally, and the system invisibly handles the complex access scoping in the background.

### Outcomes
- **Exponential Time Savings:** What used to take analysts hours of exporting CSVs and building pivot tables now takes mere seconds via a simple chat interface.
- **Enterprise-Grade Security:** A bulletproof RBAC system ensures that an analyst assigned to "Retail" cannot accidentally (or maliciously) peek into "Healthcare" feedback.
- **Actionable Visualizations:** The seamless transition from text-based AI summaries to dynamically generated Recharts graphs provides a comprehensive understanding of both the "why" and the "what" of customer sentiment.

---

## 4. Conclusion

AuditAI successfully demonstrates the profound impact of coupling deep, unstructured data retrieval with Generative AI in an enterprise setting. By prioritizing data security through robust RBAC, optimizing performance via caching and intelligent database indexing, and providing a beautifully humanized chat interface, AuditAI transforms raw customer feedback into a strategic superpower.

It is no longer just about passively looking at data; it is about actively conversing with your business insights, allowing organizations to maintain an agile, customer-centric approach in an ever-evolving market.
