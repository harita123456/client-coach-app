const mongoose = require("mongoose");

const workoutAssignmentSchema = new mongoose.Schema(
  {
    workout_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'workouts',
      required: true
    },
    coach_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    assigned_date: {
      type: Date,
      default: Date.now
    },
    due_date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned'
    },
    completion_date: {
      type: Date
    },
    exercises: [{
      exercise_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
      },
      sets: String,
      reps: String,
      weight: String,
      rest_time: String,
      order: String,
      completed_sets: [{
        set_number: String,
        reps_completed: String,
        weight_used: String,
        notes: String
      }],
      notes: String,
      is_completed: {
        type: Boolean,
        default: false
      }
    }],
    client_notes: String,
    coach_feedback: String,
    is_active: {
      type: Boolean,
      default: true
    },
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("WorkoutAssignment", workoutAssignmentSchema); 