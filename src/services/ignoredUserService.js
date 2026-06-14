import { IgnoredUser } from '../database/models/IgnoredUser.js';

/**
 * Escapes special regex characters in a string.
 * @param {string} string 
 * @returns {string}
 */
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Adds a user to the ignored list.
 * @param {object} params
 * @param {string} [params.userId] - The Discord user ID
 * @param {string} [params.username] - The username or display name to ignore
 * @returns {Promise<boolean>} True if successful
 */
export async function ignoreUser({ userId, username }) {
  try {
    if (userId) {
      await IgnoredUser.findOneAndUpdate(
        { userId },
        { userId, username: username || undefined },
        { upsert: true }
      );
      return true;
    } else if (username) {
      const normalized = username.trim();
      if (!normalized) return false;
      await IgnoredUser.findOneAndUpdate(
        { username: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } },
        { username: normalized },
        { upsert: true }
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error ignoring user (id: ${userId}, name: ${username}):`, error);
    return false;
  }
}

/**
 * Removes a user from the ignored list.
 * @param {object} params
 * @param {string} [params.userId] - The Discord user ID
 * @param {string} [params.username] - The username or display name to unignore
 * @returns {Promise<boolean>} True if any matches were deleted
 */
export async function unignoreUser({ userId, username }) {
  try {
    const conditions = [];
    if (userId) {
      conditions.push({ userId });
    }
    if (username) {
      const normalized = username.trim();
      if (normalized) {
        conditions.push({ username: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } });
      }
    }

    if (conditions.length === 0) return false;

    const result = await IgnoredUser.deleteMany({ $or: conditions });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error unignoring user:', error);
    return false;
  }
}

/**
 * Retrieves all ignored users formatted as a list.
 * @returns {Promise<Array<string>>}
 */
export async function getIgnoredUsers() {
  try {
    const users = await IgnoredUser.find({});
    return users.map(u => {
      if (u.userId && u.username) {
        return `${u.username} (ID: ${u.userId})`;
      }
      return u.username || `ID: ${u.userId}`;
    });
  } catch (error) {
    console.error('Error fetching ignored users:', error);
    return [];
  }
}

/**
 * Checks if a member is ignored by userId, username, or display name.
 * @param {import('discord.js').GuildMember} member - The guild member object
 * @returns {Promise<boolean>} True if ignored
 */
export async function isUserIgnored(member) {
  try {
    if (!member || !member.user) return false;
    const userId = member.id;
    const username = member.user.username;
    const displayName = member.displayName;

    const conditions = [];
    if (userId) {
      conditions.push({ userId });
    }
    if (username) {
      conditions.push({ username: { $regex: new RegExp(`^${escapeRegex(username.trim())}$`, 'i') } });
    }
    if (displayName) {
      conditions.push({ username: { $regex: new RegExp(`^${escapeRegex(displayName.trim())}$`, 'i') } });
    }

    if (conditions.length === 0) return false;

    const count = await IgnoredUser.countDocuments({ $or: conditions });
    return count > 0;
  } catch (error) {
    console.error('Error checking if user is ignored:', error);
    return false;
  }
}
