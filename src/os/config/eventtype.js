goog.declareModuleId('os.config.EventType');

/**
 * Event types for settings
 * @enum {string}
 */
const EventType = {
  INITIALIZED: 'initialized',
  LOADED: 'loaded',
  WILL_CLEAR: 'willClear',
  WILL_SAVE: 'willSave',
  CLEARED: 'cleared',
  SAVED: 'saved',
  UPDATED: 'updated',
  RELOADED: 'reloaded'
};

export default EventType;
