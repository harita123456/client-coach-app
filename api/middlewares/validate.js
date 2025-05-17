const { z } = require('zod');

// Auth validation schemas
const registerSchema = z.object({
  email_address: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  user_type: z.enum(['coach', 'client'])
});

const loginSchema = z.object({
  email_address: z.string().email(),
  password: z.string()
});

// Exercise validation schemas
const exerciseSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  instructions: z.object({
    text: z.string().min(10),
    image_url: z.string().url().optional(),
    video_url: z.string().url().optional()
  }),
  muscle_groups: z.array(z.string()).min(1),
  equipment: z.string().optional()
});

// Workout validation schemas
const workoutExerciseSchema = z.object({
  exercise_id: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  rest_time: z.number().int().positive(),
  order: z.number().int().positive()
});

const workoutSchema = z.object({
  name: z.string().min(2),
  notes: z.string().optional(),
  exercises: z.array(workoutExerciseSchema).min(1)
});

// Assignment validation schemas
const performanceSchema = z.object({
  exercise_id: z.string(),
  sets_completed: z.array(z.object({
    reps: z.number().int().nonnegative(),
    weight: z.number().nonnegative(),
    notes: z.string().optional()
  })),
  comments: z.string().optional()
});

const completeWorkoutSchema = z.object({
  performance: z.array(performanceSchema),
  client_note: z.string().optional()
});

// Validation middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.errors
    });
  }
};

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    exercise: exerciseSchema,
    workout: workoutSchema,
    completeWorkout: completeWorkoutSchema
  }
}; 