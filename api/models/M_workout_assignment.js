const mongoose = require("mongoose");

const workoutAssignmentSchema = new mongoose.Schema(
  {
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'workouts',
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    completed_at: {
      type: Date,
      default: null
    },
    performance: [{
      exercise_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exercises',
        required: true
      },
      sets_completed: [{
        reps: Number,
        weight: Number,
        notes: String
      }],
      comments: String
    }],
    coach_note: {
      type: String,
      default: null
    },
    client_note: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("workout_assignments", workoutAssignmentSchema); 