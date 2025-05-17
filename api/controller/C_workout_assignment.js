const WorkoutAssignment = require("../models/M_workout_assignment");
const Workout = require("../models/M_workout");
const { successRes, errorRes } = require("../../utils/common_fun");

// Get all assignments (filtered by role)
const getAllAssignments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user.user_type === 'coach') {
      query = { 'workout.coach': req.user._id };
    } else {
      query = { client: req.user._id };
    }

    if (status) {
      query.status = status;
    }

    const assignments = await WorkoutAssignment.find(query)
      .populate({
        path: 'workout',
        populate: {
          path: 'exercises.exercise',
          select: 'name description instructions muscle_groups equipment'
        }
      })
      .populate('client', 'full_name profile_picture')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ assigned_at: -1 });

    const total = await WorkoutAssignment.countDocuments(query);

    res.json({
      success: true,
      data: assignments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await WorkoutAssignment.findById(req.params.id)
      .populate({
        path: 'workout',
        populate: {
          path: 'exercises.exercise',
          select: 'name description instructions muscle_groups equipment'
        }
      })
      .populate('client', 'full_name profile_picture');

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Check if user has access
    if (req.user.user_type === 'client' && assignment.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.user_type === 'coach') {
      const workout = await Workout.findById(assignment.workout);
      if (workout.coach.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete workout (Client only)
const completeWorkout = async (req, res) => {
  try {
    const { performance, client_note } = req.body;
    const assignment = await WorkoutAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (assignment.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    assignment.performance = performance;
    assignment.client_note = client_note;
    assignment.status = 'completed';
    assignment.completed_at = new Date();
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add coach feedback
const addCoachNote = async (req, res) => {
  try {
    const { coach_note } = req.body;
    const assignment = await WorkoutAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const workout = await Workout.findById(assignment.workout);
    if (workout.coach.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    assignment.coach_note = coach_note;
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  completeWorkout,
  addCoachNote
}; 