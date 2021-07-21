goog.module('os.ui.draw.EventType');
goog.module.declareLegacyNamespace();

/**
 * This enumerates the drawing event type constants.
 * @enum {string}
 */
exports = {
  ACTIVE: 'draw.active',
  CHANGE: 'draw.change',
  COMPLETE: 'draw.complete',
  CANCEL: 'draw.cancel',
  INACTIVE: 'draw.inactive',
  CALCULATING: 'draw.calculating',
  CALC_COMPLETE: 'draw.calc.complete',
  CALC_PROGRESS: 'draw.calc.progress'
};
