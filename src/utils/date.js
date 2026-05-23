/**
 * Returns the current date in YYYY-MM-DD format using the Asia/Bangkok (GMT+7) timezone.
 * @returns {string} The local date string.
 */
export function getLocalDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

