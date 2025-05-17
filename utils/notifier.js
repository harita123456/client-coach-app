const admin = require('firebase-admin');
const User = require('../api/models/M_user');

// Initialize Firebase Admin
const serviceAccount = require('../service_account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const notify = async (userId, title, message, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcm_token) return;

    const notification = {
      title,
      body: message,
      data
    };

    await admin.messaging().send({
      token: user.fcm_token,
      notification,
      data
    });

    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Workout-specific notifications
const notifyWorkoutAssigned = async (clientId, workoutId, workoutName) => {
  await notify(
    clientId,
    'New Workout Assigned',
    `You have been assigned a new workout: ${workoutName}`,
    {
      type: 'WORKOUT_ASSIGNED',
      workoutId: workoutId.toString()
    }
  );
};

const notifyWorkoutCompleted = async (coachId, clientId, workoutId, workoutName) => {
  // Notify coach
  await notify(
    coachId,
    'Workout Completed',
    `Your client has completed the workout: ${workoutName}`,
    {
      type: 'WORKOUT_COMPLETED',
      workoutId: workoutId.toString(),
      clientId: clientId.toString()
    }
  );
};

const notifyCoachFeedback = async (clientId, workoutId, workoutName) => {
  await notify(
    clientId,
    'Coach Feedback',
    `Your coach has provided feedback on your workout: ${workoutName}`,
    {
      type: 'COACH_FEEDBACK',
      workoutId: workoutId.toString()
    }
  );
};

module.exports = {
  notify,
  notifyWorkoutAssigned,
  notifyWorkoutCompleted,
  notifyCoachFeedback
}; 