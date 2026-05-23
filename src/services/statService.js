import { Stat } from '../database/models/Stat.js';
import { ActiveSession } from '../database/models/ActiveSession.js';
import { getLocalDateString } from '../utils/date.js';

/**
 * Adds connection duration to a user's total for the current date.
 * @param {string} userId - The Discord user ID
 * @param {string} username - The Discord username
 * @param {number} durationMs - The session duration in milliseconds
 * @returns {Promise<void>}
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
    console.error(`Error adding duration for user ${username} (${userId}) to MongoDB:`, error);
  }
}

/**
 * Retrieves the connection duration stats for the current date.
 * @returns {Promise<object>} Map of user stats keyed by userId
 */
export async function getStatsForToday() {
  try {
    const dateStr = getLocalDateString();
    const stat = await Stat.findOne({ date: dateStr });
    return stat && stat.users ? Object.fromEntries(stat.users) : {};
  } catch (error) {
    console.error('Error fetching today\'s stats from MongoDB:', error);
    return {};
  }
}

/**
 * Resets the voice duration statistics for the current date.
 * @returns {Promise<void>}
 */
export async function resetStatsForToday() {
  try {
    const dateStr = getLocalDateString();
    await Stat.deleteOne({ date: dateStr });
  } catch (error) {
    console.error('Error resetting today\'s stats in MongoDB:', error);
  }
}

/**
 * Saves or updates an active voice channel session.
 * @param {string} userId - The Discord user ID
 * @param {string} username - The Discord username
 * @param {number|Date} joinTime - The timestamp or Date when they joined
 * @returns {Promise<void>}
 */
export async function saveActiveSession(userId, username, joinTime) {
  try {
    const time = typeof joinTime === 'number' ? new Date(joinTime) : joinTime;
    await ActiveSession.findOneAndUpdate(
      { userId },
      { username, joinTime: time },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error saving active session for user ${username} (${userId}) to MongoDB:`, error);
  }
}

/**
 * Removes an active session for a user.
 * @param {string} userId - The Discord user ID
 * @returns {Promise<void>}
 */
export async function deleteActiveSession(userId) {
  try {
    await ActiveSession.deleteOne({ userId });
  } catch (error) {
    console.error(`Error deleting active session for user ${userId} from MongoDB:`, error);
  }
}

/**
 * Retrieves all active sessions.
 * @returns {Promise<Array<object>>} List of active sessions
 */
export async function getActiveSessions() {
  try {
    return await ActiveSession.find({});
  } catch (error) {
    console.error('Error fetching active sessions from MongoDB:', error);
    return [];
  }
}

/**
 * Resets/restarts active sessions to now.
 * @param {Array<string>} userIds - List of user IDs to reset
 * @returns {Promise<void>}
 */
export async function resetActiveSessions(userIds) {
  try {
    const now = new Date();
    await ActiveSession.updateMany(
      { userId: { $in: userIds } },
      { joinTime: now }
    );
  } catch (error) {
    console.error('Error resetting active sessions in MongoDB:', error);
  }
}

