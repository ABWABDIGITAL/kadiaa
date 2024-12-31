const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const https = require("https");

const router = express.Router();

// MyFatoorah API constants
const BASE_URL = "https://apitest.myfatoorah.com";
const API_KEY = "rLtt6JWvbUHDDhsZnfpAhpYk4dxYDQkbcPTyGaKp2TYqQgG7FGZ5Th_WD53Oq8Ebz6A53njUoo1w3pjU1D4vs_ZMqFiz_j0urb_BH9Oq9VZoKFoJEDAbRZepGcQanImyYrry7Kt6MnMdgfG5jn4HngWoRdKduNNyP4kzcp3mRv7x00ahkm9LAK7ZRieg7k1PDAnBIOG3EyVSJ5kK4WLMvYr7sCwHbHcu4A5WwelxYK0GMJy37bNAarSJDFQsJ2ZvJjvMDmfWwDVFEVe_5tOomfVNt6bOg9mexbGjMrnHBnKnZR1vQbBtQieDlQepzTZMuQrSuKn-t5XZM7V6fCW7oP-uXGX-sMOajeX65JOf6XVpk29DP6ro8WTAflCDANC193yof8-f5_EYY-3hXhJj7RBXmizDpneEQDSaSz5sFk0sV5qPcARJ9zGG73vuGFyenjPPmtDtXtpx35A-BVcOSBYVIWe9kndG3nclfefjKEuZ3m4jL9Gg1h2JBvmXSMYiZtp9MR5I6pvbvylU_PP5xJFSjVTIz7IQSjcVGO41npnwIxRXNRxFOdIUHn0tjQ-7LwvEcTXyPsHXcMD8WtgBh-wxR8aKX7WPSsT1O8d8reb2aR7K3rkV3K82K_0OgawImEpwSvp9MNKynEAJQS6ZHe_J_l77652xwPNxMRTMASk1ZsJL"; // Replace with your actual API key

// Mongoose Schema
const transactionSchema = new mongoose.Schema({
  isSuccess: Boolean,
  invoiceId: Number,
  invoiceStatus: String,
  invoiceReference: String,
  customerReference: String,
  createdDate: Date,
  expiryDate: String,
  expiryTime: String,
  invoiceValue: Number,
  comments: String,
  customerName: String,
  customerMobile: String,
  customerEmail: String,
  userDefinedField: String,
  invoiceDisplayValue: String,
  dueDeposit: Number,
  depositStatus: String,
  invoiceItems: Array,
  suppliers: Array,
  invoiceTransactions: [
    {
      transactionDate: Date,
      paymentGateway: String,
      referenceId: String,
      trackId: String,
      transactionId: String,
      paymentId: String,
      authorizationId: String,
      transactionStatus: String,
      transactionValue: Number,
      customerServiceCharge: Number,
      totalServiceCharge: Number,
      dueValue: Number,
      paidCurrency: String,
      paidCurrencyValue: Number,
      vatAmount: Number,
      ipAddress: String,
      country: String,
      currency: String,
      error: String,
      cardNumber: String,
      errorCode: String,
      eci: String,
    },
  ],
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// Axios instance with IPv4 preference
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ family: 4 }),
});

// Utility: Call MyFatoorah API
const callApi = async (apiUrl, apiKey, requestData) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${API_KEY}`,
    };

    const response = await axiosInstance.post(apiUrl, requestData, { headers });
    if (!response.data || !response.data.IsSuccess) {
      throw new Error("API call failed: " + JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    console.error("Error calling API:", error.message);
    throw new Error(error.response?.data?.Message || error.message);
  }
};

// Route: Get and Store Payment Status
router.post("/get-payment-status", async (req, res) => {
  const { Key, KeyType } = req.body;

  // Validate request input
  if (!Key || !KeyType) {
    return res.status(400).json({ message: "Key and KeyType are required." });
  }

  const apiUrl = `${BASE_URL}/v2/getPaymentStatus`;

  try {
    // Call MyFatoorah API
    const apiResponse = await callApi(apiUrl, API_KEY, { Key, KeyType });

    // Extract and prepare data for MongoDB storage
    const { IsSuccess, Data: data } = apiResponse;

    const transaction = new Transaction({
      isSuccess: IsSuccess,
      invoiceId: data.InvoiceId,
      invoiceStatus: data.InvoiceStatus,
      invoiceReference: data.InvoiceReference,
      customerReference: data.CustomerReference,
      createdDate: new Date(data.CreatedDate),
      expiryDate: data.ExpiryDate,
      expiryTime: data.ExpiryTime,
      invoiceValue: data.InvoiceValue,
      comments: data.Comments,
      customerName: data.CustomerName,
      customerMobile: data.CustomerMobile,
      customerEmail: data.CustomerEmail,
      userDefinedField: data.UserDefinedField,
      invoiceDisplayValue: data.InvoiceDisplayValue,
      dueDeposit: data.DueDeposit,
      depositStatus: data.DepositStatus,
      invoiceItems: data.InvoiceItems || [],
      suppliers: data.Suppliers || [],
      invoiceTransactions: (data.InvoiceTransactions || []).map((txn) => ({
        transactionDate: new Date(txn.TransactionDate),
        paymentGateway: txn.PaymentGateway,
        referenceId: txn.ReferenceId,
        trackId: txn.TrackId,
        transactionId: txn.TransactionId,
        paymentId: txn.PaymentId,
        authorizationId: txn.AuthorizationId,
        transactionStatus: txn.TransactionStatus,
        transactionValue: txn.TransactionValue,
        customerServiceCharge: txn.CustomerServiceCharge,
        totalServiceCharge: txn.TotalServiceCharge,
        dueValue: txn.DueValue,
        paidCurrency: txn.PaidCurrency,
        paidCurrencyValue: txn.PaidCurrencyValue,
        vatAmount: txn.VatAmount,
        ipAddress: txn.IpAddress,
        country: txn.Country,
        currency: txn.Currency,
        error: txn.Error,
        cardNumber: txn.CardNumber,
        errorCode: txn.ErrorCode,
        eci: txn.ECI,
      })),
    });

    // Save data to MongoDB
    const savedTransaction = await transaction.save();
    res.status(200).json({
      message: "Payment status retrieved and stored successfully.",
      data: savedTransaction,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
