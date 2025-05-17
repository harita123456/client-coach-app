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
            required: [true, "Exercise name is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Exercise description is required"]
        },
        instructions: {
            text: {
                type: String,
                required: [true, "Exercise instructions text is required"]
            },
            image_url: {
                type: String,
                default: null
            },
            video_url: {
                type: String,
                default: null
            }
        },
        media_file: {
            type: [mediaFileImage]
        },
        muscle_groups: [{
            type: String,
            required: [true, "At least one muscle group is required"]
        }],
        equipment: {
            type: String,
            default: null
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("exercises", exerciseSchema); 