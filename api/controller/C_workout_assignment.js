const WorkoutAssignment = require("../models/M_workout_assignment");
const Workout = require("../models/M_workout");
const User = require("../models/M_user");
const user_sessions = require("../models/M_user_session");
const { successRes, errorRes } = require("../../utils/common_fun");
const { sendNotification } = require("../../utils/send_notification");

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

// Assign workout to client
const assignWorkout = async (req, res) => {
  try {
    const { workout_id, client_id, due_date } = req.body;

    // Validate required fields
    if (!workout_id || !client_id || !due_date) {
      return errorRes(res, "Workout ID, client ID, and due date are required");
    }

    // Check if workout exists and belongs to the coach
    const workout = await Workout.findById(workout_id);
    if (!workout) {
      return errorRes(res, "Workout not found");
    }

    if (workout.coach_id.toString() !== req.user._id.toString()) {
      return errorRes(res, "You can only assign workouts that you created");
    }

    // Check if client exists and is actually a client
    const client = await User.findOne({
      _id: client_id,
      user_type: 'client',
      is_active: true,
      is_deleted: false
    });

    if (!client) {
      return errorRes(res, "Client not found or is not active");
    }

    // Check if there's already an active assignment for this workout and client
    const existingAssignment = await WorkoutAssignment.findOne({
      workout_id,
      client_id,
      status: { $in: ['assigned', 'in_progress'] },
      is_active: true,
      is_deleted: false
    });

    if (existingAssignment) {
      return errorRes(res, "Client already has an active assignment for this workout");
    }

    // Validate due date
    const dueDate = new Date(due_date);
    if (dueDate < new Date()) {
      return errorRes(res, "Due date cannot be in the past");
    }

    // Create workout assignment
    const assignmentData = {
      workout_id,
      coach_id: req.user._id,
      client_id,
      due_date: dueDate,
      exercises: workout.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_time: ex.rest_time,
        order: ex.order
      }))
    };

    const assignment = new WorkoutAssignment(assignmentData);
    await assignment.save();

    let noti_data = {
      noti_title: `${req.user.full_name}`,
      noti_msg: `You have been assigned a new workout: ${workout.name}`,
      noti_for: 'workout_assigned',
    }

    let findDeviceTokens = await user_sessions.find({
      user_id: client_id,
    });

    let deviceTokenArray = findDeviceTokens.map((row) => row.device_token);

    if (deviceTokenArray.length > 0) {
      noti_data = { ...noti_data, device_token: deviceTokenArray };
      console.log("noti sent topic");
      multiNotificationSend(noti_data);
    }

    return successRes(res, "Workout assigned successfully", assignment);
  } catch (error) {
    console.error("Assign workout error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Get assigned workouts for client
const getClientAssignments = async (req, res) => {
  try {
    const assignments = await WorkoutAssignment.aggregate([
      // Match assignments for the current client
      {
        $match: {
          client_id: req.user._id,
          is_deleted: false
        }
      },
      // Lookup workout details
      {
        $lookup: {
          from: 'workouts',
          localField: 'workout_id',
          foreignField: '_id',
          as: 'workout'
        }
      },
      // Unwind workout array
      {
        $unwind: '$workout'
      },
      // Lookup coach details
      {
        $lookup: {
          from: 'users',
          localField: 'coach_id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                full_name: 1,
                profile_picture: 1,
                specialization: 1,
                credentials: 1
              }
            }
          ],
          as: 'coach'
        }
      },
      // Unwind coach array
      {
        $unwind: '$coach'
      },
      // Lookup exercise details for each exercise in the workout
      {
        $lookup: {
          from: 'exercises',
          localField: 'exercises.exercise_id',
          foreignField: '_id',
          as: 'exerciseDetails'
        }
      },
      // Add exercise details to each exercise in the assignment
      {
        $addFields: {
          exercises: {
            $map: {
              input: '$exercises',
              as: 'exercise',
              in: {
                $mergeObjects: [
                  '$$exercise',
                  {
                    exercise_details: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$exerciseDetails',
                            as: 'detail',
                            cond: { $eq: ['$$detail._id', '$$exercise.exercise_id'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          status: 1,
          assigned_date: 1,
          due_date: 1,
          completion_date: 1,
          client_notes: 1,
          coach_feedback: 1,
          'workout._id': 1,
          'workout.name': 1,
          'workout.description': 1,
          'workout.notes': 1,
          exercises: {
            $map: {
              input: '$exercises',
              as: 'ex',
              in: {
                exercise_id: '$$ex.exercise_id',
                sets: '$$ex.sets',
                reps: '$$ex.reps',
                weight: '$$ex.weight',
                rest_time: '$$ex.rest_time',
                order: '$$ex.order',
                is_completed: '$$ex.is_completed',
                completed_sets: '$$ex.completed_sets',
                notes: '$$ex.notes',
                exercise_details: {
                  name: '$$ex.exercise_details.name',
                  category: '$$ex.exercise_details.category',
                  equipment: '$$ex.exercise_details.equipment',
                  instructions: '$$ex.exercise_details.instructions',
                  muscleGroups: '$$ex.exercise_details.muscleGroups',
                  videoUrl: '$$ex.exercise_details.videoUrl',
                  imageUrl: '$$ex.exercise_details.imageUrl'
                }
              }
            }
          },
          coach: {
            _id: '$coach._id',
            full_name: '$coach.full_name',
            profile_picture: '$coach.profile_picture',
            specialization: '$coach.specialization',
            credentials: '$coach.credentials'
          }
        }
      },
      // Sort by assigned date
      {
        $sort: { assigned_date: -1 }
      }
    ]);

    return successRes(res, "Assignments retrieved successfully", assignments);
  } catch (error) {
    console.error("Get client assignments error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Get assignments created by coach
const getCoachAssignments = async (req, res) => {
  try {
    const assignments = await WorkoutAssignment.find({
      coach_id: req.user._id,
      is_deleted: false
    })
      .populate('workout_id')
      .populate('client_id', 'full_name profile_picture')
      .sort({ assigned_date: -1 });

    return successRes(res, "Assignments retrieved successfully", assignments);
  } catch (error) {
    console.error("Get coach assignments error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Update exercise completion
const updateExerciseCompletion = async (req, res) => {
  try {
    const { assignment_id, exercise_id } = req.params;
    const { completed_sets, notes } = req.body;

    const assignment = await WorkoutAssignment.findOne({
      _id: assignment_id,
      client_id: req.user._id
    });

    if (!assignment) {
      return errorRes(res, "Assignment not found");
    }

    // Find and update the exercise
    const exercise = assignment.exercises.id(exercise_id);
    if (!exercise) {
      return errorRes(res, "Exercise not found in assignment");
    }

    exercise.completed_sets = completed_sets;
    exercise.notes = notes;
    exercise.is_completed = true;

    // Check if all exercises are completed
    const allCompleted = assignment.exercises.every(ex => ex.is_completed);
    if (allCompleted) {
      assignment.status = 'completed';
      assignment.completion_date = new Date();
    } else {
      assignment.status = 'in_progress';
    }

    await assignment.save();

    return successRes(res, "Exercise completion updated successfully", assignment);
  } catch (error) {
    console.error("Update exercise completion error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Add client notes to workout
const addClientNotes = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { notes } = req.body;

    const assignment = await WorkoutAssignment.findOne({
      _id: assignment_id,
      client_id: req.user._id
    });

    if (!assignment) {
      return errorRes(res, "Assignment not found");
    }

    assignment.client_notes = notes;
    await assignment.save();

    return successRes(res, "Client notes added successfully", assignment);
  } catch (error) {
    console.error("Add client notes error:", error);
    return errorRes(res, "Internal server error");
  }
};

// Add coach feedback
const addCoachFeedback = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { feedback } = req.body;

    const assignment = await WorkoutAssignment.findOne({
      _id: assignment_id,
      coach_id: req.user._id
    });

    if (!assignment) {
      return errorRes(res, "Assignment not found");
    }

    assignment.coach_feedback = feedback;
    await assignment.save();

    // Send notification to client
    await sendNotification({
      user_id: assignment.client_id,
      title: "New Coach Feedback",
      message: "Your coach has added feedback to your workout",
      type: "coach_feedback"
    });

    return successRes(res, "Coach feedback added successfully", assignment);
  } catch (error) {
    console.error("Add coach feedback error:", error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  completeWorkout,
  addCoachNote,
  assignWorkout,
  getClientAssignments,
  getCoachAssignments,
  updateExerciseCompletion,
  addClientNotes,
  addCoachFeedback
}; 