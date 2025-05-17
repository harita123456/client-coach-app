const Workout = require("../models/M_workout");
const { successRes, errorRes } = require("../../utils/common_fun");

// Create a new workout (Coach only)
const createWorkout = async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      coach: req.user._id,
    });
    await workout.save();
    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all workouts for a client
const getClientWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ client: req.user._id })
      .populate("exercises.exercise")
      .populate("coach", "full_name profile_picture");
    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all workouts created by a coach
const getCoachWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ coach: req.user._id })
      .populate("exercises.exercise")
      .populate("client", "full_name profile_picture");
    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get workout by ID
const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate("coach", "name email")
      .populate(
        "exercises.exercise_id",
        "name category equipment difficulty instructions muscleGroups"
      );

    if (!workout) {
      return errorRes(res, {
        statusCode: 404,
        message: "Workout not found",
      });
    }

    console.log({ workout });

    // Check if user has access to this workout
    if (
      workout.coach?._id.toString() !== req.user._id.toString() &&
      workout.client?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return successRes(res, {
      message: "Workout retrieved successfully",
      data: workout,
    });
  } catch (error) {
    console.log(error);
    return errorRes(res, {
      message: "Error retrieving workout",
      error,
    });
  }
};

// Update workout status (Client only)
const updateWorkoutStatus = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: "Workout not found" });
    }

    if (workout.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    workout.status = req.body.status;
    if (req.body.status === "completed") {
      workout.completed_date = new Date();
    }
    await workout.save();

    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add client notes to workout
const addClientNotes = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: "Workout not found" });
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
};

// Add coach feedback to workout
const addCoachFeedback = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: "Workout not found" });
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
};

module.exports = {
  createWorkout,
  getClientWorkouts,
  getCoachWorkouts,
  getWorkoutById,
  updateWorkoutStatus,
  addClientNotes,
  addCoachFeedback,
};
