goog.declareModuleId('os.ui.draw.EventType');

/**
 * This enumerates the drawing event type constants.
 * @enum {string}
 */
const EventType = {
  ACTIVE: 'draw.active',
  CHANGE: 'draw.change',
  COMPLETE: 'draw.complete',
  CANCEL: 'draw.cancel',
  INACTIVE: 'draw.inactive',
  CALCULATING: 'draw.calculating',
  CALC_COMPLETE: 'draw.calc.complete',
  CALC_PROGRESS: 'draw.calc.progress'
};

export default EventType;
