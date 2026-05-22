/**
 * Formats a duration in milliseconds into a human-readable string (e.g., "1h 15m 30s" or "15m 30s").
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(durationMs) {
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  let durationText = '';
  if (hours > 0) {
    durationText += `${hours}h `;
  }
  durationText += `${minutes}m ${seconds}s`;
  return durationText;
}

/**
 * Formats user session stats entries into a clean ASCII monospaced table.
 * @param {Array<[string, object]>} userEntries - Array of user stats entries
 * @returns {string} Monospaced Markdown code block containing the formatted table
 */
export function formatStatsTable(userEntries) {
  if (!userEntries || userEntries.length === 0) {
    return 'No voice channel activity has been recorded today yet.';
  }

  const lines = [
    'User         Duration     Status',
    '---------------------------------'
  ];

  userEntries.forEach(([_, userStat]) => {
    const durationText = formatDuration(userStat.totalDurationMs);
    const name = userStat.username.substring(0, 15).padEnd(16);
    const dur = durationText.padEnd(14);
    const status = userStat.isOnline ? 'Active' : 'Offline';

    lines.push(`${name} ${dur} ${status}`);
  });

  return `\`\`\`text\n${lines.join('\n')}\n\`\`\``;
}
