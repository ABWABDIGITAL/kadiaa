const Case = require("../models/caseModel");
const Location = require("../models/locationModel");
const ApiError = require("../utils/ApiError");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

const searchCases = async (req, res, next) => {
  const { query, filters = {}, page = 1, limit = 10 } = req.query;

  // Validate page and limit
  const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const pageSize = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;

  // Build search criteria
  const buildCriteria = async () => {
    const criteria = {};

    if (query) {
      criteria.$or = [
        { title: { $regex: query, $options: "i" } },
        { caseType: { $regex: query, $options: "i" } }
      ];
    }

    // Filter by caseType if provided
    if (filters.caseType) {
      criteria.caseType = { $regex: filters.caseType, $options: "i" };
    }

    // Filter by price range if provided
    if (filters.minPrice && filters.maxPrice) {
      criteria.price = {
        $gte: parseFloat(filters.minPrice),
        $lte: parseFloat(filters.maxPrice),
      };
    }

    // Filter by date if provided
    if (filters.date) {
      const date = new Date(filters.date);
      criteria.date = {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Handle location filtering
    if (filters.location) {
      try {
        const location = await Location.findOne({
          name: { $regex: filters.location, $options: "i" },
        });

        if (location) {
          criteria.location = location._id;
        } else {
          console.log("No matching location found:", filters.location);
        }
      } catch (error) {
        console.error("Error finding location:", error);
        throw new ApiError("Error finding location", 500);
      }
    }

    return criteria;
  };

  try {
    const criteria = await buildCriteria();

    console.log("Search query:", query || "No query provided");
    console.log("Combined search criteria:", criteria);

    // Apply pagination
    const cases = await Case.find(criteria)
      .populate("location")
      .select("-__v")
      .skip((pageNumber - 1) * pageSize)  // Skip the previous pages
      .limit(pageSize);  // Limit the number of results per page

    const totalCount = await Case.countDocuments(criteria);  // Get total count for pagination metadata

    console.log("Cases found:", cases);

    res.status(200).json(formatSuccessResponse({
      data: cases,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        pageSize
      }
    }, "Cases retrieved successfully"));
  } catch (error) {
    console.error("Search error:", error);
    next(new ApiError("Server error", 500));
  }
};

module.exports = {
  searchCases,
};
