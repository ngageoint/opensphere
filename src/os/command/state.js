goog.module('os.command.State');
goog.module.declareLegacyNamespace();

/**
 * The states of commands
 * @enum {string}
 */
exports = {
  READY: 'ready',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  ERROR: 'error',
  REVERTING: 'reverting'
};
