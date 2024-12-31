const axios = require("axios");
const PaymentTransaction = require("../models/paymentTransaction");
const dotenv = require("dotenv");
const axiosRetry = require("axios-retry");

// Load environment variables
dotenv.config();

const FATOORA_API_KEY = process.env.FATOORA_API_KEY;
const FATOORA_API_URL = process.env.FATOORA_API_URL;

// Validate environment variables
if (!FATOORA_API_KEY || !FATOORA_API_URL) {
  console.error("Missing environment variables:");
  console.error("FATOORA_API_URL:", FATOORA_API_URL);
  console.error("FATOORA_API_KEY:", FATOORA_API_KEY ? "Loaded" : "Missing");
  throw new Error(
    "Missing FATOORA_API_KEY or FATOORA_API_URL in environment variables."
  );
}

// Retry logic for API calls
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`Retrying request... Attempt ${retryCount}`);
    return retryCount * 1000; // Delay increases with each retry attempt
  },
  shouldRetry: (error) => {
    console.error("Retry Condition Error:", error.message);
    return error.response?.status === 500; // Retry on server errors
  },
});

// Utility: Handle API Errors
const handleApiError = (error) => {
  console.error("Full Error Object:", error); // Log the entire error object for debugging

  if (error.response) {
    // API responded with an error
    const errorMessage =
      error.response.data?.Message ||
      error.response.statusText ||
      "Unknown API error";
    const statusCode = error.response.status || 500;
    console.error(
      `API Error Response: ${errorMessage} (Status: ${statusCode})`
    );
    return { message: errorMessage, statusCode };
  } else if (error.request) {
    // No response received from the API
    console.error("API Error: No response received", error.request);
    return { message: "No response received from API", statusCode: 503 };
  } else {
    // Error in setting up the request
    console.error("API Error: Request setup failed", error.message);
    return { message: error.message, statusCode: 500 };
  }
};

// Utility: Make API Request
const makeApiRequest = async (endpoint, data) => {
  try {
    console.log("Sending API request to:", `${FATOORA_API_URL}${endpoint}`);
    console.log("Payload:", JSON.stringify(data));

    const response = await axios.post(`${FATOORA_API_URL}${endpoint}`, data, {
      headers: {
        Authorization: `Bearer ${FATOORA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Raw API Response:", response.data);

    // Handle unexpected structure or missing 'Data'
    if (!response.data || !response.data.Data) {
      console.error("Unexpected API response structure:", response.data);
      throw new Error("Unexpected API response structure");
    }

    return response.data.Data;
  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    console.error("API request failed details:", {
      endpoint,
      data,
      message,
      statusCode,
    });
    throw new Error(`API request failed: ${message} (Status: ${statusCode})`);
  }
};

// Utility: Validate KeyType
const validateKeyType = (keyType) => {
  const validKeyTypes = ["InvoiceId", "PaymentId", "CustomerReference"];

  console.log("Validating KeyType:", keyType); // Log the incoming keyType
  console.log("Expected Valid KeyTypes:", validKeyTypes);

  if (!keyType || !validKeyTypes.includes(keyType)) {
    console.error("Validation failed for KeyType:", keyType);
    throw new Error(
      `Invalid or missing KeyType. Expected one of: ${validKeyTypes.join(
        ", "
      )}.`
    );
  }
};

// Endpoint for Sending Only Key and KeyType
exports.sendKeyTypeRequest = async (req, res) => {
  try {
    console.log("Incoming request body:", req.body); // Log request data

    const { key, keyType } = req.body;

    // Validate the keyType and key presence
    validateKeyType(keyType);

    if (!key || typeof key !== "string" || key.trim() === "") {
      throw new Error("Key is required and must be a valid string.");
    }

    // Prepare the payload with only Key and KeyType
    const requestPayload = {
      Key: key, // Include Key
      KeyType: keyType, // Include KeyType
    };

    console.log("Request Payload:", requestPayload);

    // Send the request payload to the external service or API
    const response = await makeApiRequest(
      "/v2/Invoices/Details",
      requestPayload
    );

    // Return success response
    res.status(200).json({
      message: "Request sent successfully",
      response: response,
    });
  } catch (error) {
    console.error(
      "Error sending key type request:",
      error.stack || error.message
    );
    res.status(500).json({
      message: "Failed to send key type request",
      error: error.message,
    });
  }
};

// Handle Payment Response (Callback)
exports.handlePaymentResponse = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    console.log("Fetching payment status for Invoice ID:", invoiceId);

    // Fetch payment status from MyFatoorah
    const { InvoiceStatus, TransactionId } = await makeApiRequest(
      "/v2/Invoices/PaymentStatus",
      {
        Key: invoiceId,
        KeyType: "InvoiceId",
      }
    );

    // Update payment status in database
    const updatedTransaction = await PaymentTransaction.findOneAndUpdate(
      { invoiceId },
      { status: InvoiceStatus, transactionId: TransactionId },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    res.status(200).json({
      message: "Payment transaction updated successfully",
      paymentTransaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error handling payment response:", error.message);
    res.status(500).json({
      message: "Failed to handle payment response",
      error: error.message,
    });
  }
};
