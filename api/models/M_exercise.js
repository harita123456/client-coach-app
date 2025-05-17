const mongoose = require("mongoose");

const mediaFileImage = new mongoose.Schema([
  {
    file_type: {
      type: String,
      enum: ["image", "video"],
      required: [true, "File type is required."],
    },
    file_name: {
      type: String,
    },
    file_path: {
      type: String,
    },
    thumbnail: {
      type: String,
      default: null,
    },
  },
]);

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    equipment: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    muscleGroups: [
      {
        type: String,
        trim: true,
      },
    ],
    videoUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Create index for faster searches
exerciseSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model("exercises", exerciseSchema);
