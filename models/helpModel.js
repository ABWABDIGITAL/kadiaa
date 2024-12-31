const mongoose = require("mongoose");

const helpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must not exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
  },
  
);

const Help = mongoose.model("Help", helpSchema);

module.exports = Help;
