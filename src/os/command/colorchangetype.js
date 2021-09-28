goog.declareModuleId('os.command.style.ColorChangeType');

/**
 * Change types for color commands. Determines how color/opacity is set in style configs.
 * @enum {string}
 */
const ColorChangeType = {
  COMBINED: 'combined',
  FILL: 'fill',
  STROKE: 'stroke'
};

export default ColorChangeType;
