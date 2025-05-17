const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const {
  getAllAssignments,
  getAssignmentById,
  completeWorkout,
  addCoachNote
} = require("../controller/C_workout_assignment");

// Get all assignments (filtered by role)
router.get("/", isAuthenticated, getAllAssignments);

// Get assignment by ID
router.get("/:id", isAuthenticated, getAssignmentById);

// Complete workout (Client only)
router.post("/:id/complete", isAuthenticated, completeWorkout);

// Add coach feedback
router.patch("/:id/coach-note", isAuthenticated, isCoach, addCoachNote);

module.exports = router; 