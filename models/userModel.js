const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: [true, "Username is required"],
    }, 
    phone: { type: String, unique: true },
    slug: {
      type: String,
      lowercase: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      minlength: [6, "Password too short"],
      maxlength: 60,
      select: false,
    },
    newPassword: {
      type: String,
      minlength: [6, "Password too short"],
      maxlength: 60,
      select: false,
    },
    confirmPassword: {
      type: String,
      minlength: [6, "Password too short"],
      maxlength: 60,
      select: false,
    },
    isAdmin: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        deeplink: { type: String, trim: true },
      },
    ],
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    resetPasswordToken: String,
    refreshToken: String,
    role: {
      type: String,
      enum: ["user", "manager", "admin", "lawyer"],
      default: "user",
    },
    profileImage: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    facebookId: String,
    googleId: String,
    appleId: String,
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // Skip password hashing if it's not modified
  }

  try {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    console.error('Password not defined for user:', this);
    throw new Error('User password is not defined');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
