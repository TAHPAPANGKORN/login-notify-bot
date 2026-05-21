import fs from 'fs/promises';
import path from 'path';

const STATS_FILE = path.resolve('voice_stats.json');

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
 * Reads all stats from the JSON file.
 */
async function readStatsFile() {
  try {
    const content = await fs.readFile(STATS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Error reading stats file:', error);
    return {};
  }
}

/**
 * Writes stats back to the JSON file.
 */
async function writeStatsFile(data) {
  try {
    await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing stats file:', error);
  }
}

/**
 * Adds connection duration to a user's total for the current date.
 */
export async function addDuration(userId, username, durationMs) {
  const data = await readStatsFile();
  const dateStr = getLocalDateString();

  if (!data[dateStr]) {
    data[dateStr] = {};
  }

  if (!data[dateStr][userId]) {
    data[dateStr][userId] = {
      username: username,
      totalDurationMs: 0
    };
  }

  data[dateStr][userId].username = username; // Update username in case it has changed
  data[dateStr][userId].totalDurationMs += durationMs;

  await writeStatsFile(data);
}

/**
 * Retrieves the connection duration stats for the current date.
 */
export async function getStatsForToday() {
  const data = await readStatsFile();
  const dateStr = getLocalDateString();
  return data[dateStr] || {};
}

/**
 * Resets the voice duration statistics for the current date.
 */
export async function resetStatsForToday() {
  const data = await readStatsFile();
  const dateStr = getLocalDateString();
  delete data[dateStr];
  await writeStatsFile(data);
}
