const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send SMS
const sendSms = async (phoneNumber, message) => {
  try {
    const messageResponse = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent to ${phoneNumber}: ${messageResponse.sid}`);
    return messageResponse;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Unable to send SMS');
  }
};

module.exports = sendSms;
