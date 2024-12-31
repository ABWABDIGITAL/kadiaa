// middleware/globalError.js

const ApiError = require("../utils/ApiError");
const { formatErrorResponse } = require("../utils/responseFormatter");

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    sendErrorForProd(err, res);
  }
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json(formatErrorResponse(err.statusCode, err.message));
};

const sendErrorForProd = (err, res) => {
  res.status(err.statusCode).json(formatErrorResponse(err.statusCode, err.message));
};

module.exports = globalError;
