const Help = require("../models/helpModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

exports.createHelp = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json(formatErrorResponse("Title and description are required"));
    }

    const help = await Help.create({ title, description });

    res.status(201).json(
      formatSuccessResponse(help, "Help article created successfully")
    );
  } catch (error) {
    console.error("Error creating help article:", error);
    res.status(500).json(
      formatErrorResponse("Failed to create help article")
    );
  }
};

exports.getAllHelps = async (req, res) => {
  try {
    const helps = await Help.find();

    res.status(200).json(
      formatSuccessResponse(helps, "Fetched all help articles successfully")
    );
  } catch (error) {
    console.error("Error fetching help articles:", error);
    res.status(500).json(
      formatErrorResponse("Failed to fetch help articles")
    );
  }
};
