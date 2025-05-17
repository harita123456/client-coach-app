const mongoose = require('mongoose');
const Exercise = require('../api/models/M_exercise');
require('dotenv').config();

const exercises = [
  {
    name: "Push-ups",
    description: "A classic bodyweight exercise that targets the chest, shoulders, and triceps",
    instructions: {
      text: "1. Start in a plank position with hands slightly wider than shoulders\n2. Lower your body until your chest nearly touches the floor\n3. Push your body back up to the starting position",
      image_url: null,
      video_url: null
    },
    muscle_groups: ["chest", "shoulders", "triceps"],
    equipment: "none"
  },
  {
    name: "Squats",
    description: "A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes",
    instructions: {
      text: "1. Stand with feet shoulder-width apart\n2. Lower your body by bending your knees and pushing your hips back\n3. Keep your chest up and back straight\n4. Return to standing position",
      image_url: null,
      video_url: null
    },
    muscle_groups: ["quadriceps", "hamstrings", "glutes"],
    equipment: "none"
  },
  {
    name: "Pull-ups",
    description: "An upper body exercise that primarily targets the back and biceps",
    instructions: {
      text: "1. Hang from a bar with hands slightly wider than shoulders\n2. Pull your body up until your chin is over the bar\n3. Lower your body back to the starting position",
      image_url: null,
      video_url: null
    },
    muscle_groups: ["back", "biceps", "shoulders"],
    equipment: "pull-up bar"
  }
];

const seedExercises = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing exercises
    await Exercise.deleteMany({});

    // Insert new exercises
    await Exercise.insertMany(exercises);

    console.log('Exercise database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedExercises(); 