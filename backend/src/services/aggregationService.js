import Review from '../models/Review.model.js';

export const calculateNPS = async (domain, category, user) => {
  let rbacMatch = {
    year: { $ne: null },
    month: { $ne: null },
  };

  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  const isAllDomains = normalizedDomain === "all";
  const isAllCategories = normalizedCategory === "all";

  if (user.role === "Admin") {
    if (!isAllDomains) {
      rbacMatch.domain = normalizedDomain;
    }

    if (!isAllCategories) {
      rbacMatch.categories = { $in: [normalizedCategory] };
    }
  } else {
    if (isAllDomains) {
      rbacMatch.domain = { $in: user.assignedDomains };
    } else {
      rbacMatch.domain = normalizedDomain;
    }

    if (isAllCategories) {
      rbacMatch.categories = { $in: user.assignedCategories };
    } else {
      rbacMatch.categories = { $in: [normalizedCategory] };
    }
  }

  const pipeline = [
    { $match: rbacMatch },
    {
      $group: {
        _id: { year: "$year", month: "$month" }, 
        totalReviews: { $sum: 1 },
        promoters: {
          $sum: { $cond: [{ $gte: ["$rating", 9] }, 1, 0] }
        },
        detractors: {
          $sum: { $cond: [{ $lte: ["$rating", 6] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        // Formating period for the frontend charts (e.g, "2024-9")
        period: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] },
        totalReviews: 1,
        npsScore: {
          $round: [
            {
              $cond: [
                { $eq: ["$totalReviews", 0] },
                0,
                {
                  $multiply: [
                    {
                      $subtract: [
                        { $divide: ["$promoters", "$totalReviews"] },
                        { $divide: ["$detractors", "$totalReviews"] }
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          ]
        },
        _id: 0
      }
    }
  ];

  const startTime = Date.now();
  const data = await Review.aggregate(pipeline);
  const executionTimeMs = Date.now() - startTime;

  return { data, pipeline, executionTimeMs, rbacMatch };
};