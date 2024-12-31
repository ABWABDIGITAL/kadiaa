

const ApiError = require("../utils/ApiError");
const { formatErrorResponse, formatSuccessResponse } = require("../utils/responseFormatter");

const handleJwtInvalidSignatureError = () => new ApiError("Invalid token", 401);
const handleJwtExpiredSignatureError = () => new ApiError("Expired token", 401);

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") {
      err = handleJwtInvalidSignatureError();
    }
    if (err.name === "TokenExpiredError") {
      err = handleJwtExpiredSignatureError();
    }
    sendErrorForProd(err, res);
  }
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json(formatSuccessResponse(null, err.message));
};

const sendErrorForProd = (err, res) => {
  res.status(err.statusCode).json(formatSuccessResponse(null, err.message));
};

module.exports = globalError;
