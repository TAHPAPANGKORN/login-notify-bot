import { IgnoredRoom } from '../database/models/IgnoredRoom.js';

/**
 * Escapes characters in a string for safe use in a regular expression.
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Adds a room to the ignored list. Case-insensitive.
 * @param {string} roomName
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function ignoreRoom(roomName) {
  try {
    const normalized = roomName.trim();
    if (!normalized) return false;
    
    // Case-insensitive check and update
    await IgnoredRoom.findOneAndUpdate(
      { roomName: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } },
      { roomName: normalized },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error(`Error ignoring room ${roomName}:`, error);
    return false;
  }
}

/**
 * Removes a room from the ignored list. Case-insensitive.
 * @param {string} roomName
 * @returns {Promise<boolean>} True if removed, false if not found or error
 */
export async function unignoreRoom(roomName) {
  try {
    const normalized = roomName.trim();
    if (!normalized) return false;

    const result = await IgnoredRoom.deleteOne({
      roomName: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Error unignoring room ${roomName}:`, error);
    return false;
  }
}

/**
 * Retrieves all ignored room names.
 * @returns {Promise<Array<string>>}
 */
export async function getIgnoredRooms() {
  try {
    const rooms = await IgnoredRoom.find({});
    return rooms.map(r => r.roomName);
  } catch (error) {
    console.error('Error fetching ignored rooms:', error);
    return [];
  }
}

/**
 * Checks if a room name is ignored. Case-insensitive.
 * @param {string} roomName
 * @returns {Promise<boolean>}
 */
export async function isRoomIgnored(roomName) {
  try {
    if (!roomName) return false;
    const normalized = roomName.trim();
    const count = await IgnoredRoom.countDocuments({
      roomName: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }
    });
    return count > 0;
  } catch (error) {
    console.error(`Error checking ignored status for room ${roomName}:`, error);
    return false;
  }
}
