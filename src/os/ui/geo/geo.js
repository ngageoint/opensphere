goog.declareModuleId('os.ui.geo');

/**
 * The title for the rings UIs.
 * @type {string}
 */
let ringTitle = 'Ring';

/**
 * Get the title for the rings UIs.
 * @return {string}
 */
export const getRingTitle = () => ringTitle;

/**
 * Set the title for the rings UIs.
 * @param {string} value The title.
 */
export const setRingTitle = (value) => {
  ringTitle = value;
};
