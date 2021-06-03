goog.module('os.command.style');
goog.module.declareLegacyNamespace();

/**
 * Change types for color commands. Determines how color/opacity is set in style configs.
 * @enum {string}
 */
const ColorChangeType = {
  COMBINED: 'combined',
  FILL: 'fill',
  STROKE: 'stroke'
};

exports = {
  ColorChangeType
};
