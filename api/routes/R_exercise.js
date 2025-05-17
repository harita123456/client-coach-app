const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");
const { getAllExercises, getExerciseById, searchExercises } = require("../controller/C_exercise");

// Get all exercises
router.get("/", isAuthenticated, getAllExercises);

// Get exercise by ID
router.get("/:id", isAuthenticated, getExerciseById);

// Search exercises
router.get("/search/:query", isAuthenticated, searchExercises);

module.exports = router; 