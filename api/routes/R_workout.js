const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const {
  createWorkout,
  getClientWorkouts,
  getCoachWorkouts,
  getWorkoutById,
  updateWorkoutStatus,
  addClientNotes,
  addCoachFeedback
} = require("../controller/C_workout");

// Create a new workout (Coach only)
router.post("/", isAuthenticated, isCoach, createWorkout);

// Get all workouts for a client
router.get("/client", isAuthenticated, getClientWorkouts);

// Get all workouts created by a coach
router.get("/coach", isAuthenticated, isCoach, getCoachWorkouts);

// Get workout by ID
router.get("/:id", isAuthenticated, getWorkoutById);

// Update workout status (Client only)
router.patch("/:id/status", isAuthenticated, updateWorkoutStatus);

// Add client notes to workout
router.patch("/:id/client-notes", isAuthenticated, addClientNotes);

// Add coach feedback to workout
router.patch("/:id/coach-feedback", isAuthenticated, isCoach, addCoachFeedback);

module.exports = router; 