goog.module('os.ui.draw.DrawEventType');
goog.module.declareLegacyNamespace();

/**
 * @enum {string}
 */
exports = {
  DRAWSTART: 'drawstart',
  DRAWCHANGE: 'drawchange',
  DRAWEND: 'drawend',
  DRAWCANCEL: 'drawcancel',
  DRAWBOX: 'box',
  DRAWCIRCLE: 'circle',
  DRAWPOLYGON: 'polygon',
  DRAWLINE: 'line'
};
