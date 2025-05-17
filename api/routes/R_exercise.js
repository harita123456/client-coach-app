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

// Get exercise by ID
router.get("/:id", isAuthenticated, getExerciseById);

// Search exercises
router.get("/search/:query", isAuthenticated, searchExercises);

// Import exercises from Excel file
router.post("/import", isAuthenticated, importExercises);

module.exports = router;
