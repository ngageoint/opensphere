goog.module('os.config.EventType');
goog.module.declareLegacyNamespace();

/**
 * Event types for settings
 * @enum {string}
 */
exports = {
  INITIALIZED: 'initialized',
  LOADED: 'loaded',
  WILL_CLEAR: 'willClear',
  WILL_SAVE: 'willSave',
  CLEARED: 'cleared',
  SAVED: 'saved',
  UPDATED: 'updated',
  RELOADED: 'reloaded'
};
