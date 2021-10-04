goog.declareModuleId('os.time.period');

/**
 * Takes an ISO-8601 period and converts it to milliseconds.
 *
 * @param {string} period The period to convert
 * @return {number} The number of milliseconds represented by the period
 * @deprecated Please use {@link moment.duration(period).asMilliseconds()} instead
 */
export const toMillis = function(period) {
  return moment.duration(period).asMilliseconds();
};

/**
 * Takes milliseconds and converts it to an ISO-8601 time period string.
 *
 * @param {number} ms The range in milliseconds
 * @return {string} An ISO-8601 formatted period string
 * @deprecated Please use {@link moment.duration(ms).toISOString()} instead
 */
export const toTimePeriod = function(ms) {
  return moment.duration(ms).toISOString();
};
