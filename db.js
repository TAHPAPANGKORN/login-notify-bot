import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

// Connect to MongoDB with production-friendly options and connection status logs
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to production database (MongoDB Atlas).'))
  .catch((err) => {
    console.error('Database connection error:', err);
  });

// Schema definition for statistics
const StatSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  users: {
    type: Map,
    of: new mongoose.Schema({
      username: { type: String, required: true },
      totalDurationMs: { type: Number, required: true, default: 0 }
    }, { _id: false })
  }
}, { collection: 'voice_session_stats' }); // Explicit production collection name

const Stat = mongoose.model('Stat', StatSchema);

/**
 * Returns the current date in YYYY-MM-DD format using the local timezone offset.
 */
export function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

/**
 * Adds connection duration to a user's total for the current date.
 */
export async function addDuration(userId, username, durationMs) {
  try {
    const dateStr = getLocalDateString();
    
    // Find or create statistics document for the current date
    let stat = await Stat.findOne({ date: dateStr });
    if (!stat) {
      stat = new Stat({ date: dateStr, users: new Map() });
    }

    // Retrieve or initialize user stat record
    const userStat = stat.users.get(userId) || { username, totalDurationMs: 0 };
    userStat.username = username;
    userStat.totalDurationMs += durationMs;
    stat.users.set(userId, userStat);

    await stat.save();
  } catch (error) {
    console.error('Error adding duration to MongoDB:', error);
  }
}

/**
 * Retrieves the connection duration stats for the current date.
 */
export async function getStatsForToday() {
  try {
    const dateStr = getLocalDateString();
    const stat = await Stat.findOne({ date: dateStr });
    return stat && stat.users ? Object.fromEntries(stat.users) : {};
  } catch (error) {
    console.error('Error fetching stats from MongoDB:', error);
    return {};
  }
}

/**
 * Resets the voice duration statistics for the current date.
 */
export async function resetStatsForToday() {
  try {
    const dateStr = getLocalDateString();
    await Stat.deleteOne({ date: dateStr });
  } catch (error) {
    console.error('Error resetting stats in MongoDB:', error);
  }
}
