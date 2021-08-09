goog.module('os.ui.geo');
goog.module.declareLegacyNamespace();

/**
 * The title for the rings UIs.
 * @type {string}
 */
let ringTitle = 'Ring';

/**
 * Get the title for the rings UIs.
 * @return {string}
 */
const getRingTitle = () => ringTitle;

/**
 * Set the title for the rings UIs.
 * @param {string} value The title.
 */
const setRingTitle = (value) => {
  ringTitle = value;
};

exports = {
  getRingTitle,
  setRingTitle
};
