const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the schema for lawyers with proper validation
const lawyerSchema = new mongoose.Schema(
  {
    nameLawyer: { type: String, required: true, trim: true },
    password: {
      type: String,
      // Conditionally require password only if googleId is not provided
      required: function () {
        return !this.googleId;
      },
    },
     phone: {
      type: String,
      required: function () {
       
        return !this.googleId;
      },
      required: false,
      unique: false, // Ensure phone is unique when present
      sparse: true, // Allows unique index to ignore documents with null/undefined values
    },
    email: { type: String, unique: false, required: false, sparse: true },  // remove the unique index

    googleId: {
      type: String,
      default: null, // This will help distinguish Google OAuth users
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: false,
    },
    caseTypes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaseType",
      required: false,
    },
    expertise: [
      {
        field: { type: String },
        years: { type: Number },
       
      },
    ],
    otp: { type: String },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verified: { type: Boolean, default: false },
    notifications: [
      {
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        deeplink: { type: String, trim: true },
        
      },
    ],
    language: [{ type: String }],
    contact: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
     
    },
    personalData: {
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["male", "female"] },
      biography: { type: String, trim: true },
    },
    createdAt: { type: Date, trim: true },
    profilePicture: { type: String },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash the password if it exists and has been modified
lawyerSchema.pre("save", async function (next) {
  // Only hash password if it's present (this will skip hashing for Google OAuth users)
  if (this.password && this.isModified("password")) {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
      return next(new Error("Error hashing password"));
    }
  }
  next();
});

// Method to compare passwords
lawyerSchema.methods.correctPassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Indexes
lawyerSchema.index({ email: 1 });
lawyerSchema.index({ phone: 1 });

// Customize the JSON output of the schema to remove sensitive fields
lawyerSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Do not return the password in the response
  },
});

const Lawyer = mongoose.model("Lawyer", lawyerSchema);
module.exports = Lawyer;
