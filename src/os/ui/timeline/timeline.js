goog.declareModuleId('os.ui.timeline');

/**
 * The timeline axis height.
 * @type {number}
 */
let axisHeight = 30;

/**
 * The timeline axis width.
 * @type {number}
 */
let axisWidth = 30;

/**
 * The timeline handle height.
 * @type {number}
 */
let handleHeight = 15;

/**
 * Get the timeline axis height.
 * @return {number} The height.
 */
export const getAxisHeight = () => axisHeight;

/**
 * Set the timeline axis height.
 * @param {number} value The height.
 */
export const setAxisHeight = (value) => {
  axisHeight = value;
};

/**
 * Get the timeline axis width.
 * @return {number} The width.
 */
export const getAxisWidth = () => axisWidth;

/**
 * Set the timeline axis width.
 * @param {number} value The width.
 */
export const setAxisWidth = (value) => {
  axisWidth = value;
};

/**
 * Get the timeline handle height.
 * @return {number} The height.
 */
export const getHandleHeight = () => handleHeight;

/**
 * Set the timeline handle height.
 * @param {number} value The height.
 */
export const setHandleHeight = (value) => {
  handleHeight = value;
};

/**
 * The scales used for snapping to "nice" values
 * @type {Array<number>}
 */
export const SNAP_SCALE = [
  1, // 1 ms
  5, // 5 ms
  10, // 10 ms
  25, // 25 ms
  50, // 50 ms
  1e2, // 100 ms
  5e2, // 500 ms
  1e3, // 1-second
  5e3, // 5-second
  15e3, // 15-second
  3e4, // 30-second
  6e4, // 1-minute
  3e5, // 5-minute
  9e5, // 15-minute
  18e5, // 30-minute
  36e5, // 1-hour
  108e5, // 3-hour
  216e5, // 6-hour
  432e5, // 12-hour
  864e5, // 1-day
  1728e5, // 2-day
  6048e5, // 1-week
  12096e5, // 2-week
  2592e6, // 1-month
  7776e6, // 3-month
  15552e6, // 6-month
  31536e6 // 1-year
];

/**
 * Normalizes extents that could contain either `Array<number>` or `Array<Date>`
 * to `Array<number>`.
 *
 * @param {Array<number|Date>} extent
 * @return {Array<number>} The normalized extent
 */
export const normalizeExtent = function(extent) {
  // D3 sometimes returns Array<Date> for the extent. This could be from
  // setting the extent with two dates. In any case, we will normalize that here.
  if (extent) {
    for (var i = 0, n = extent.length; i < n; i++) {
      extent[i] = typeof extent[i] === 'number' ? extent[i] : /** @type {Date} */ (extent[i]).getTime();
    }
  }

  return extent;
};

/**
 * @typedef {function(Date):(number|boolean)}
 */
export let FormatFn;

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {number} The value
 */
export const formatMillis = function(d) {
  return d.getUTCMilliseconds();
};

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {number} The value
 */
export const formatSeconds = function(d) {
  return d.getUTCSeconds();
};

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {number} The value
 */
export const formatMinutes = function(d) {
  return d.getUTCMinutes();
};

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {number} The value
 */
export const formatHours = function(d) {
  return d.getUTCHours();
};

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {boolean} The value
 */
export const formatDate = function(d) {
  return d.getUTCDate() != 1;
};

/**
 * The format function
 *
 * @param {Date} d The date
 * @return {number} The value
 */
export const formatMonth = function(d) {
  return d.getUTCMonth();
};

/**
 * The format function
 *
 * @return {boolean} The value
 */
export const trueFunction = function() {
  return true;
};

/**
 * @enum {string}
 */
export const DragPan = {
  LEFT: 'dragpanleft',
  RIGHT: 'dragpanright',
  STOP: 'dragpanstop'
};
