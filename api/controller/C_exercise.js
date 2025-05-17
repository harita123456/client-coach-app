const Exercise = require("../models/M_exercise");
const { successRes, errorRes } = require("../../utils/common_fun");
const xlsx = require("xlsx");
const path = require("path");
const { successResponse, errorResponse } = require("../../utils/common");
const { relativeTimeRounding } = require("moment");

// // Get all exercises
// const getAllExercises = async (req, res) => {
//   try {
//     const exercises = await Exercise.find({ is_active: true });
//     res.json({ success: true, data: exercises });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// Get exercise by ID
const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
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
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { muscle_groups: { $regex: query, $options: "i" } },
      ],
      is_active: true,
    });
    res.json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Import exercises from Excel file
const importExercises = async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../Workout_Exercise_Expanded_Database.xlsx"
    );

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert Excel data to JSON
    const exercises = xlsx.utils.sheet_to_json(worksheet);

    // Transform and validate the data
    const transformedExercises = exercises.map((exercise) => ({
      name: exercise.Name || exercise.name,
      category: exercise.Category || exercise.category,
      equipment: exercise.Equipment || exercise.equipment,
      instructions: exercise.Instructions || exercise.instructions,
      muscleGroups: (exercise["Muscle Groups"] || exercise.muscleGroups || "")
        .split(",")
        .map((group) => group.trim()),
      videoUrl: exercise["Video URL"] || exercise.videoUrl,
      imageUrl: exercise["Image URL"] || exercise.imageUrl,
    }));

    console.log(transformedExercises);
    // return;

    // Insert exercises into database
    const result = await Exercise.insertMany(transformedExercises, {
      ordered: false,
    });

    res.json({
      success: true,
      data: {
        totalImported: result.length,
        exercises: result,
      },
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(500).json({
        success: false,
        message: "Some exercises already exist in the database",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all exercises
const getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    res.json({ success: true, data: exercises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // getAllExercises,
  getExerciseById,
  searchExercises,
  importExercises,
  getAllExercises,
};
