import ChatHistory from '../models/ChatHistory.model.js';

export const getReports = async (req, res) => {
  try {
    const user = req.user || req.freshUser;
    const { domain, category, intent, page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    // Inherent RBAC: Admins see all company reports. Analysts only see their own history.
    const query = {};
    if (user.role !== "Admin") {
      query.userId = user._id;
    }

    if (domain && domain !== 'all') query.domainAtTime = domain.toLowerCase();
    if (category && category !== 'all') query.categoryAtTime = category.toLowerCase();
    if (intent && intent !== 'all') query.responseType = intent;

    const skip = (parsedPage - 1) * parsedLimit;

    const reports = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      // .select() strictly prevents memory overload by excluding massive prompt strings
      .select("query responseType finalResponse createdAt domainAtTime categoryAtTime metrics")
      .lean();

    const total = await ChatHistory.countDocuments(query);

    return res.status(200).json({
      reports,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit)
    });

  } catch (err) {
    console.error("Reports fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch reports." });
  }
};