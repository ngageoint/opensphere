goog.declareModuleId('os.ui.draw.DrawEventType');

/**
 * @enum {string}
 */
const DrawEventType = {
  DRAWSTART: 'drawstart',
  DRAWCHANGE: 'drawchange',
  DRAWEND: 'drawend',
  DRAWCANCEL: 'drawcancel',
  DRAWBOX: 'box',
  DRAWCIRCLE: 'circle',
  DRAWPOLYGON: 'polygon',
  DRAWLINE: 'line'
};

export default DrawEventType;
