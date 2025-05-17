const mongoose = require("mongoose");

const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'exercises',
    required: true
  },
  sets: {
    type: Number,
    required: true
  },
  reps: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    default: 0
  },
  rest_time: {
    type: Number, // in seconds
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  notes: String
});

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workout name is required"],
      trim: true
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    exercises: [workoutExerciseSchema],
    notes: String,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned'
    },
    assigned_date: {
      type: Date,
      default: Date.now
    },
    completed_date: {
      type: Date,
      default: null
    },
    client_notes: String,
    coach_feedback: String
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("workouts", workoutSchema); 