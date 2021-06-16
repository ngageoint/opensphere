goog.module('os.ui.timeline.BrushEventType');
goog.module.declareLegacyNamespace();

/**
 * @enum {string}
 */
const BrushEventType = {
  BRUSH_START: 'brushstart',
  BRUSH: 'brush',
  BRUSH_END: 'brushend'
};

exports = BrushEventType;
