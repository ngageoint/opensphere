goog.module('os.events.LayerEventType');


/**
 * @enum {string}
 */
exports = {
  ADD: 'addLayer',
  CHANGE: 'layer:change',
  REMOVE: 'removeLayer',
  RENAME: 'renameLayer',
  MOVE: 'moveLayer',
  SYNC: 'syncLayer',
  IDENTIFY: 'identifyLayer',
  COLOR_CHANGE: 'layerColorChange',
  BASELAYER_CHANGE: 'baseLayerChange'
};
