const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const {
  getAllExercises,
  getExerciseById,
  searchExercises,
  importExercises,
} = require("../controller/c_exercise");

// Get all exercises
router.get("/", isAuthenticated, getAllExercises);

// Search exercises - This needs to be before the :id route
router.get("/search", isAuthenticated, searchExercises);

// Get exercise by ID
router.get("/:id", isAuthenticated, getExerciseById);

// Import exercises from Excel file
router.post("/import", isAuthenticated, importExercises);

module.exports = router;
