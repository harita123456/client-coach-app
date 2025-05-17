const mongoose = require("mongoose");
const { decryptMessage } = require("../../utils/secure_pwd");

const usersSchema = new mongoose.Schema(
  {
    user_type: {
      type: String,
      enum: ["admin", "coach", "client"],
      default: "client",
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
    },
    email_address: {
      type: String,
      trim: true,
      index: true,
      lowercase: true,
      required: [true, "Email address is required."],
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profile_picture: {
      type: String,
      default: null,
    },
    // Coach specific fields
    credentials: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    specialization: [{
      type: String,
      default: []
    }],
    // Client specific fields
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    fitness_level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: null,
    },
    goals: [{
      type: String,
      default: []
    }],
    health_info: {
      type: String,
      default: null,
    },
    // Auth related fields
    refresh_token: {
      type: String,
      default: null
    },
    reset_token: {
      type: String,
      default: null
    },
    reset_token_expires: {
      type: Date,
      default: null
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_self_delete: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    is_online: {
      type: Boolean,
      enum: [true, false],
      default: true,
    },
    is_deleted: {
      type: Boolean,
      enum: [true, false],
      default: false,
    }
  },
  { timestamps: true, versionKey: false }
);

// usersSchema.path("password").get((value) => {
//   const decrypted = decryptMessage(value.toString());
//   return decrypted;
// });

// usersSchema.path("profile_picture").get((value) => {
//   if (value != null) {
//     return process.env.BASE_URL + value;
//   } else {
//     return value;
//   }
// });

// usersSchema.set("toJSON", { getters: true, setters: true });
// usersSchema.set("toObject", { getters: true, setters: true });

module.exports = mongoose.model("users", usersSchema);
