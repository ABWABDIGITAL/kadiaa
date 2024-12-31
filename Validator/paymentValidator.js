const asyncHandler = require("express-async-handler");
const { createPaymentIntent } = require("../Services/paymentServices");
const ApiError = require("../utils/ApiError");

exports.processPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    throw new ApiError("Amount is required", 400);
  }

  const paymentIntent = await createPaymentIntent(amount);

  res.status(200).json({ clientSecret: paymentIntent.client_secret });
});
