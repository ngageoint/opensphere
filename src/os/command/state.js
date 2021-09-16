goog.module('os.command.State');

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
