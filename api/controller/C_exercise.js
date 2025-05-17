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
    const { query } = req.query;
    
    if (!query) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const exercises = await Exercise.find({
      $or: [
        { name: searchRegex },
        { category: searchRegex },
        { equipment: searchRegex },
        { muscleGroups: searchRegex },
        { benefits: searchRegex }
      ]
    });

    return successResponse(res, {
      message: 'Search completed successfully',
      data: exercises
    });
  } catch (error) {
    return errorResponse(res, {
      message: 'Error searching exercises',
      error
    });
  }
};

// Import exercises from Excel file
const importExercises = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../../Workout_Exercise_Expanded_Database.xlsx");
    
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert Excel data to JSON
    const exercises = xlsx.utils.sheet_to_json(worksheet);

    // Transform and validate the data
    const transformedExercises = exercises.map(exercise => ({
      name: exercise.Name || exercise.name,
      category: exercise.Category || exercise.category,
      equipment: exercise.Equipment || exercise.equipment,
      difficulty: exercise.Difficulty || exercise.difficulty,
      instructions: exercise.Instructions || exercise.instructions,
      muscleGroups: (exercise['Muscle Groups'] || exercise.muscleGroups || '').split(',').map(group => group.trim()),
      videoUrl: exercise['Video URL'] || exercise.videoUrl,
      imageUrl: exercise['Image URL'] || exercise.imageUrl,
      benefits: (exercise.Benefits || exercise.benefits || '').split(',').map(benefit => benefit.trim()),
      notes: exercise.Notes || exercise.notes
    }));

    // Insert exercises into database
    const result = await Exercise.insertMany(transformedExercises, { ordered: false });

    return successResponse(res, {
      statusCode: 201,
      message: 'Exercises imported successfully',
      data: {
        totalImported: result.length,
        exercises: result
      }
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Some exercises already exist in the database',
        error
      });
    }

    return errorResponse(res, {
      statusCode: 500,
      message: 'Error importing exercises',
      error
    });
  }
};

// Get all exercises
const getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    return successResponse(res, {
      message: 'Exercises retrieved successfully',
      data: exercises
    });
  } catch (error) {
    return errorResponse(res, {
      message: 'Error retrieving exercises',
      error
    });
  }
};

module.exports = {
  // getAllExercises,
  getExerciseById,
  searchExercises,
  importExercises,
  getAllExercises,
};
