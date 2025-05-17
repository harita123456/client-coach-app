const express = require("express");
const router = express.Router();
const { isAuthenticated, isCoach } = require("../middlewares/auth");

// Create a new workout (Coach only)
router.post("/", isAuthenticated, isCoach, async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      coach: req.user._id
    });
    await workout.save();
    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all workouts for a client
router.get("/client", isAuthenticated, async (req, res) => {
  try {
    const workouts = await Workout.find({ client: req.user._id })
      .populate('exercises.exercise')
      .populate('coach', 'full_name profile_picture');
    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all workouts created by a coach
router.get("/coach", isAuthenticated, isCoach, async (req, res) => {
  try {
    const workouts = await Workout.find({ coach: req.user._id })
      .populate('exercises.exercise')
      .populate('client', 'full_name profile_picture');
    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get workout by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate('exercises.exercise')
      .populate('coach', 'full_name profile_picture')
      .populate('client', 'full_name profile_picture');
    
    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }
    
    // Check if user has access to this workout
    if (workout.coach._id.toString() !== req.user._id.toString() && 
        workout.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update workout status (Client only)
router.patch("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }
    
    if (workout.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    workout.status = req.body.status;
    if (req.body.status === 'completed') {
      workout.completed_date = new Date();
    }
    await workout.save();
    
    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add client notes to workout
router.patch("/:id/client-notes", isAuthenticated, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }
    
    if (workout.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    workout.client_notes = req.body.notes;
    await workout.save();
    
    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add coach feedback to workout
router.patch("/:id/coach-feedback", isAuthenticated, isCoach, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }
    
    if (workout.coach.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    workout.coach_feedback = req.body.feedback;
    await workout.save();
    
    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 