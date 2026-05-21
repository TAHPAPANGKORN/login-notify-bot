/**
 * Returns the current date in YYYY-MM-DD format using the local timezone offset.
 * @returns {string} The local date string.
 */
export function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}
