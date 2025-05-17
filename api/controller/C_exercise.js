const Exercise = require("../models/M_exercise");
const { successRes, errorRes } = require("../../utils/common_fun");

// Get all exercises
const getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({ is_active: true });
    res.json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get exercise by ID
const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }
    res.json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search exercises
const searchExercises = async (req, res) => {
  try {
    const query = req.params.query;
    const exercises = await Exercise.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { muscle_groups: { $regex: query, $options: 'i' } }
      ],
      is_active: true
    });
    res.json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllExercises,
  getExerciseById,
  searchExercises
}; 