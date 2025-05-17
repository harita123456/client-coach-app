const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const {
  assignWorkout,
  getClientAssignments,
  getCoachAssignments,
  updateExerciseCompletion,
  addClientNotes,
  addCoachFeedback,
  completeWorkout
} = require("../controller/C_workout_assignment");

// Coach routes
router.post("/", isAuthenticated, isCoach, assignWorkout);
router.get("/coach", isAuthenticated, isCoach, getCoachAssignments);
router.patch("/:assignment_id/feedback", isAuthenticated, isCoach, addCoachFeedback);

// Client routes
router.get("/client", isAuthenticated, getClientAssignments);
router.patch("/:assignment_id/exercise/:exercise_id", isAuthenticated, updateExerciseCompletion);
router.patch("/:assignment_id/notes", isAuthenticated, addClientNotes);
router.patch("/:assignment_id/complete", isAuthenticated, completeWorkout);

module.exports = router; 