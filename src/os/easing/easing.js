goog.declareModuleId('os.easing');

/**
 * @typedef {function(number, number, number, number)}
 */
export let EasingFunction;

/**
 * Linear easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeLinear = function(t, b, c, d) {
  t /= d;
  return c * t + b;
};

/**
 * Quintic easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeQuintic = function(t, b, c, d) {
  t /= d;
  t--;
  return c * (t * t * t * t * t + 1) + b;
};

/**
 * Quartic easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeQuartic = function(t, b, c, d) {
  t = t / (d / 2);
  if (t < 1) {
    return c * t * t * t * t / 2 + b;
  }
  t -= 2;
  return -c * (t * t * t * t - 2) / 2 + b;
};

/**
 * Quartic easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeCubic = function(t, b, c, d) {
  t = t / (d / 2);
  if (t < 1) {
    return c * t * t / 2 + b;
  }
  t -= 2;
  return -c * (t * t - 2) / 2 + b;
};

/**
 * Exponential easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeExpo = function(t, b, c, d) {
  t = t / (d / 2);
  if (t < 1) {
    return c * Math.pow(2, 10 * (t - 1)) / 2 + b;
  }
  t--;
  return c * (-Math.pow(2, -10 * t) + 2) / 2 + b;
};

/**
 * Circular easing function (this is CircleIn, not CircleOut)
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeCircular = function(t, b, c, d) {
  t /= d;
  return -c * (Math.sqrt(1 - t * t) - 1) + b;
};

/**
 * Sinusoidal easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 */
export const easeSinusoidal = function(t, b, c, d) {
  return (b + c) * (1 - Math.cos(Math.PI * t / d)) / 2;
};
